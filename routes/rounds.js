const router = require('express').Router();
const isAuthenticated = require("../Middleware/isAuthenticated");

// Model
const Event = require('../models/Event');
const EventTeam = require('../models/EventTeam');

// Validation
const { roundValidator, msToTime } = require('../utils/validation/Round');

// update rounds
router.post('/', async (req, res) => {
  const { value, error } = roundValidator(req.body);

  if (error) return res.status(400).send({ msg: error.details[0].message });

  try {
    let event = await Event.findOne();
    // let team = await EventTeam.findOne();

    event.currentRound = value.currentRound;
    event.startTime = value.startTime;
    event.endTime = value.endTime;
    event.nextRoundStartTime = value.nextRoundStartTime;
    await event.save();

    const teams = await EventTeam.find({ "progress.roundNumber": { "$lt": Number(event.currentRound)-1 }});
    for (const team of teams){
      team.progress.roundNumber = Number(event.currentRound)-1;
      team.progress.questionNumber = 0;
      await team.save();
  }

    // team.progress.roundNumber = event.currentRound;
    // team.progress.questionNumber = 1;
    // await team.save();

    req.app.set('event', event);
    res.send({ meassage: `Round set to ${event.currentRound}`, data: event });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// toggle acitve
router.get('/active', async (req, res) => {
  const event = await Event.findOne();
  event.isActive = !event.isActive;
  await event.save();

  req.app.set('event', event);
  res.send({ msg: `isActive set to ${event.isActive}`, data: event });
});

router.get('/roundDetails', isAuthenticated, async(req, res) => {
  let TIME_STONE_MINUTES_ADVANTAGE = 0;
  const team = req.user;
  const event = await Event.findOne();
    if(team.stoneActive.includes("time")){
      TIME_STONE_MINUTES_ADVANTAGE = 30;
    }
  if(Number(team.progress.roundNumber) >= Number(event.currentRound)){
    return res.send(
      {
        "duration": msToTime(event.endTime - event.startTime), 
        "timeRemaining": msToTime(0),
        "nextRoundStartTime" :msToTime(event.nextRoundStartTime -Date.now()),
      });
  }
  res.send(
    {
      "duration": msToTime(event.endTime - event.startTime), 
      "timeRemaining": msToTime((event.endTime-Date.now())+TIME_STONE_MINUTES_ADVANTAGE*60000),
      "nextRoundStartTime" :msToTime(event.nextRoundStartTime -Date.now()),
    });
});

module.exports = router;
