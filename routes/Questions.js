const router = require("express").Router();
const bcrypt = require("bcrypt");
const isAdmin = require("../Middleware/isAdmin");
const isAuthenticated = require("../Middleware/isAuthenticated");
const Participant = require("../models/participant");

// Model
const Question = require("../models/questions");
const Hint = require("../models/Hints");
const { ROUNDS, STONES } = require("../utils/CONSTANTS");

// Validation
const {
  questionCreateValidator,
  submitAnswerValidator,
  hintCreateValidator,
} = require("../utils/validation/questions.js");

router.get("/noOfQuestions", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (!team.finished) {
    const questionRoundNumber = req.user.progress.roundNumber;
    const questionsOfRound = await Question.find({
      roundNumber: questionRoundNumber + 1,
    });
    const noOfQuestions = questionsOfRound.length;
    if (noOfQuestions === 0) {
      return res.status(400).send({
        error: "Invalid Request",
        message: "No Questions For This Round",
      });
    }
    res.status(200).send(noOfQuestions.toString());
  } else {
    return res.status(404).send({
      error: "You Have Completed The Event",
      message: "Invalid Request",
    });
  }
});

// * get all questions by round
router.get("/round", isAuthenticated, async (req, res) => {
  const eventObj = req.app.get("event");

  if (!eventObj)
    return res
      .status(500)
      .send({ error: "no event object found", message: "retry" });
  if (!eventObj.isActive)
    return res.status(500).send({
      error: "event is not active",
      message: "wait for the evetn to start ",
    });
  let questions = await Question.find({
    round: eventObj.currentRound,
  }).select("-answer");

  res.json({ data: questions });
});

router.post("/create", isAdmin, async (req, res) => {
  const { error, value } = questionCreateValidator(req.body);

  if (error)
    return res
      .status(400)
      .send({ error: error.details[0].message, message: "Invalid body" });

  const salt = await bcrypt.genSalt(10);
  const hashedAns = await bcrypt.hash(value.answer, salt);

  const newQuestion = new Question({
    ...value,
    answer: hashedAns,
  });

  await newQuestion.save();

  res.send({ data: newQuestion });
});

router.post("/createHint", isAdmin, async (req, res) => {
  const { error, value } = hintCreateValidator(req.body);

  if (error)
    return res
      .status(400)
      .send({ error: error.details[0].message, message: "Invalid body" });

  const Ques = await Question.findOne({
    questionNumber: value.questionNumber,
    roundNumber: value.roundNumber,
  });
  const newHint = new Hint({
    questionId: Ques._id,
    text: value.text,
    cost: value.cost,
  });

  await newHint.save();
  res.send({ data: newHint });
});

router.get("/nextQuestion", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (!team.finished) {
    const progress = req.user.progress;
    const nextQuestion = await Question.findOne({
      questionNumber: progress.questionNumber + 1,
      roundNumber: progress.roundNumber + 1,
    });
    if (!nextQuestion) {
      return res.status(400).send({
        error: "No More Next Question Found",
        message: "Invalid Request",
      });
    }
    res.status(200).send(nextQuestion);
  } else {
    return res.status(404).send({
      error: "You Have Completed The Event",
      message: "Invalid Request",
    });
  }
});

router.get("/questionHintCost/:qId", isAuthenticated, async (req, res) => {
  const team = req.user;
  const { qId } = req.params;
  question = await Question.findById(qId);
  const progress = req.user.progress;
  if (question.questionNumber != progress.questionNumber + 1) {
    return res.status(400).send({
      error: "The question you're asking the hint is not your current question",
    });
  }
  const questionHint = await Hint.findOne({ questionId: qId });
  if (!questionHint) {
    return res
      .status(400)
      .send({ error: "No Hint Found", message: "Invalid Request" });
  }
  res.send({ questionHintCost: questionHint.cost });
});

router.get("/questionHint/:qId", isAuthenticated, async (req, res) => {
  const team = req.user;
  const { qId } = req.params;
  question = await Question.findById(qId);
  const progress = req.user.progress;
  if (question.questionNumber != progress.questionNumber + 1) {
    return res.status(400).send({
      error: "The question you're asking the hint is not your current question",
    });
  }
  const questionHint = await Hint.findOne({ questionId: qId });
  if (!questionHint) {
    return res
      .status(400)
      .send({ error: "No Hint Found", message: "Invalid Request" });
  }

  const hintAlreadyTaken = team.hintsTaken.includes(questionHint._id);
  if (
    team.stoneActive.includes("power") &&
    team.powerHints > 0 &&
    !hintAlreadyTaken
  ) {
    team.powerHints = team.powerHints - 1;
    team.hintsTaken.push(questionHint._id);
    if (team.powerHints === 0) {
      team.stoneActive.splice(team.stoneActive.indexOf("power"), 1);
    }
    await team.save();
  } else if (!hintAlreadyTaken) {
    team.points = team.points - questionHint.cost;
    team.hintsTaken.push(questionHint._id);
    await team.save();
  }
  res.send({ questionHint: questionHint, powerHint: team.powerHints });
});

router.post("/submitAnswer/:qId", async (req, res) => {
  const { qId } = req.params; //! valid id
  const { error, value } = submitAnswerValidator(req.body);
  const team = req.user;
  let finished = false;
  let snap = false;

  if (error)
    return res
      .status(400)
      .send({ error: error.details[0].message, message: "invalid req body" });
  const question = await Question.findById(qId);
  if (!question)
    return res
      .status(400)
      .send({ error: "question id not found", message: "invalid question" });

  const GOT_ALL_STONES = team.stones.includes("power") && team.stones.includes("space") && team.stones.includes("reality") && team.stones.includes("soul") && team.stones.includes("time") && team.stones.includes("mind");
  const IS_LAST_QUESTION_OF_EVENT = (team.progress.roundNumber === 5) && (team.progress.questionNumber + 1 === question.questionNumber);

  const HAS_TEAM_ADVANCED_TO_NEXT_ROUND = (team.progress.roundNumber >= question.roundNumber);
  const HAS_TEAM_ADVANCED_TO_NEXT_QUESTION = (team.progress.questionNumber >= question.questionNumber);
  const HAS_TEAM_FINSHED_EVENT = (team.progress.roundNumber === -1) || (team.finished);
  
  const IS_CORRECT = await bcrypt.compare(value.answer, question.answer);
  if(HAS_TEAM_ADVANCED_TO_NEXT_ROUND || HAS_TEAM_ADVANCED_TO_NEXT_QUESTION || HAS_TEAM_FINSHED_EVENT){
    let snap, finished;
    if (GOT_ALL_STONES) {
      snap = true;
    }
    if (IS_LAST_QUESTION_OF_EVENT) {
      finished = true
    }
    return res.status(200).send({
      data: {
        correct: IS_CORRECT,
      },
      finishStatus: {
        finished: finished,
        snap: snap,
      },
    });
  }

  if (IS_CORRECT) {

    const query = {
      questionNumber: question.questionNumber + 1,
      roundNumber: team.progress.roundNumber + 1,
    };
    const nextQuestion = await Question.findOne(query);

    if (nextQuestion) {
      //If it is not the last question and the next question is also there, then just increment the progress question number
      team.progress = {
        questionNumber: question.questionNumber,
        roundNumber: team.progress.roundNumber,
      };
    } 
    else {
      const CURRENT_ROUND_ELIGIBLE_STONE = STONES[team.progress.roundNumber];
      if (!team.stones.includes(CURRENT_ROUND_ELIGIBLE_STONE)) {
        team.stones.push(CURRENT_ROUND_ELIGIBLE_STONE);
      }
      if (IS_LAST_QUESTION_OF_EVENT) {
        

        if (GOT_ALL_STONES) {
          snap = true;
          team.snap = true;
          team.snappedAt = Date.now();
        }
        finished = true;
        team.finished = true;
        team.progress = {
          questionNumber: -1,
          roundNumber: -1,
        };
      } else {
        team.progress = {
          questionNumber: 0,
          roundNumber: team.progress.roundNumber + 1,
        };
      }
    }
    // if (f)
    if (team.points) {
      team.points = team.points + question.points;
    } else {
      team.points = question.points;
    }
    await team.save();
  }

  res.send({
    data: {
        correct: IS_CORRECT,
    },
    finishStatus: {
      finished,
      snap,
    },
  });
});

module.exports = router;
