const express = require("express");
const router = express.Router();
const EventTeam = require("../models/EventTeam");

const isAuthenticated = require("../Middleware/isAuthenticated");

router.get("/profile", isAuthenticated, async(req, res) => {
    res.send(req.user);
});
    
router.get("/leaderboard", isAuthenticated, async(req, res) => {
    let teams = await EventTeam.find();
    teams = teams.filter((team) => {
        return !team.stoneActive.includes("reality")
    });
    res.send(teams);
});


module.exports = router;