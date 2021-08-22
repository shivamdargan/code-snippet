const router = require("express").Router();
const isAuthenticated = require("../Middleware/isAuthenticated");
const Question = require("../models/questions");
const Hint = require("../models/Hints");
const EventTeam = require("../models/EventTeam");
const path = require("path");
//If Power Stone Is Active
router.post("/activatePower", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (team.stones.includes("power")) {
    if (team.powerHints === 0) {
      team.stoneActive.push("power");
      team.powerHints = 5;
      const index = team.stones.indexOf("power");
      team.stones.splice(index, 1);
      await team.save();
      res.status(200).send({
        stoneActive: team.stoneActive,
        powerHints: team.powerHints,
      });
    } else {
      return res.status(400).send({
        error: "Cannot Avail More Hints If Some Power Hints Are Not Used",
        message: "Invalid Request",
      });
    }
  } else {
    return res.status(400).send({
      error: "You Do Not Have Power Stone in Your Inventory",
      message: "Invalid Request",
    });
  }
});

router.post("/activateSpace", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (team.stones.includes("space")) {
    if ((team.progress.roundNumber !== 5) && (team.progress.roundNumber !== 4) ) {
      team.stoneActive.push("space");
      const index = team.stones.indexOf("space");
      team.stones.splice(index, 1);
      let pointsGained = 0;
      const toSkipQuestion = await Question.findOne({
        questionNumber: team.progress.questionNumber + 4,
        roundNumber: team.progress.roundNumber + 1,
      });
      // console.log(toSkipQuestion);
      const firstSkipQuestion = await Question.findOne({
        questionNumber: team.progress.questionNumber + 1,
        roundNumber: team.progress.roundNumber + 1,
      });
      const secondSkipQuestion = await Question.findOne({
        questionNumber: team.progress.questionNumber + 2,
        roundNumber: team.progress.roundNumber + 1,
      });
      const thirdSkipQuestion = await Question.findOne({
        questionNumber: team.progress.questionNumber + 3,
        roundNumber: team.progress.roundNumber + 1,
      });
      if (thirdSkipQuestion && !toSkipQuestion) {
        pointsGained =
          firstSkipQuestion.points +
          secondSkipQuestion.points +
          thirdSkipQuestion.points;
        // console.log("points gained logic");
      }
      if (toSkipQuestion) {
        // console.log("normal logic")
        team.progress.questionNumber = team.progress.questionNumber + 3;
        team.points =
          team.points +
          (firstSkipQuestion.points +
            secondSkipQuestion.points +
            thirdSkipQuestion.points);
      }
      if (!toSkipQuestion) {
        // console.log("Carry Over Logic")
        //To Find The Carryover Question Number For Progressing To The Next Round As Skipping 3 Questions Was Making The User Progress To The Next Round
        const questionsOfRound = await Question.find({
          roundNumber: team.progress.roundNumber + 1,
        });
        const noOfQuestions = questionsOfRound.length;
        const carryOver = team.progress.questionNumber + 3 - noOfQuestions;
        // console.log(carryOver);
        team.progress = {
          questionNumber: carryOver,
          roundNumber: team.progress.roundNumber + 1,
        };
        if (pointsGained && carryOver === 0) {
          team.points = team.points + pointsGained;
          // console.log(pointsGained);
        } else {
          if (carryOver === 1) {
            const firstCarryQuestion = await Question.findOne({
              questionNumber: 1,
              roundNumber: team.progress.roundNumber + 1,
            });
            // console.log(firstCarryQuestion);
            team.points =
              team.points +
              (firstSkipQuestion.points +
                secondSkipQuestion.points +
                firstCarryQuestion.points);
          } else if (carryOver === 2) {
            const firstCarryQuestion = await Question.findOne({
              questionNumber: 1,
              roundNumber: team.progress.roundNumber + 1,
            });
            const secondCarryQuestion = await Question.findOne({
              questionNumber: 2,
              roundNumber: team.progress.roundNumber + 1,
            });
            //  console.log(secondCarryQuestion);
            team.points =
              team.points +
              (firstSkipQuestion.points +
                firstCarryQuestion.points +
                secondCarryQuestion.points);
          }
        }
      }
      team.stoneActive.splice(team.stoneActive.indexOf("space"), 1);
      await team.save();
      res.status(200).send({
        questionNumber: team.questionNumber,
        roundNumber: team.roundNumber,
      });
    } else {
      return res.status(400).send({
        error: ` Sorry, You Cannot Use Space Stone In Round ${
          team.progress.roundNumber + 1
        }`,
        message: "Invalid Request",
      });
    }
  } else {
    return res.status(400).send({
      error: "You Do Not Have Space Stone in Your Inventory",
      message: "Invalid Request",
    });
  }
});

router.post("/activateTime", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (team.stones.includes("time")) {
    team.stoneActive.push("time");
    const index = team.stones.indexOf("time");
    team.stones.splice(index, 1);
    await team.save();
    res.status(200).send({ message: "Time Stone activated" });
  } else {
    return res.status(400).send({
      error: "You Do Not Have Time Stone in Your Inventory",
      message: "Invalid Request",
    });
  }
});

router.post("/activateSoul", isAuthenticated, async (req, res) => {
  const currentTeam = req.user;
  if (!currentTeam.stones.includes("soul")) {
    return res.status(400).send({
      error: "Couldn't find Soul stone in your gauntlet",
      message: "Bad request",
    });
  }
  const teamIds = req.body;
  const teams = await EventTeam.find({ _id: { $in: teamIds.teams } });
  for (const team of teams) {
    team.points = Math.round(Number(team.points * 0.9));
    await team.save();
  }
  currentTeam.stones.splice(currentTeam.stones.indexOf("soul"), 1);
  await currentTeam.save();
  return res.send({ message: "Stone Used" });
});

router.post("/deactivateTime", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (team.stoneActive.includes("time")) {
    team.stoneActive.splice(team.stoneActive.indexOf("time"), 1);
    await team.save();
    res.status(200).send({ message: "Time Stone Deactivated" });
  } else {
    return res.status(400).send({
      error: "Time Stone Is Not Active Currently",
      message: "Invalid Request",
    });
  }
});

router.post("/activateReality", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (team.stones.includes("reality")) {
    team.stoneActive.push("reality");
    const index = team.stones.indexOf("reality");
    team.stones.splice(index, 1);
    await team.save();
    res.status(200).send({ message: "Reality Stone activated" });
  } else {
    return res.status(400).send({
      error: "You Do Not Have Reality Stone in Your Inventory",
      message: "Invalid Request",
    });
  }
});

router.post("/deactivateReality", isAuthenticated, async (req, res) => {
  const team = req.user;
  if (team.stoneActive.includes("reality")) {
    team.stoneActive.splice(team.stoneActive.indexOf("reality"), 1);
    await team.save();
    res.status(200).send({ message: "Reality Stone Deactivated" });
  } else {
    return resf.status(400).send({
      error: "Reality Stone Is Not Active Currently",
      message: "Invalid Request",
    });
  }
});

module.exports = router;
