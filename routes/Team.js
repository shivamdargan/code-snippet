const router = require("express").Router();
// * Models
const EventTeam = require("../models/EventTeam");
const Team = require("../models/BaseTeam");

//* validation
// const teamValidator = require("../utils/validation/Team");

// //* Middleware
const isAuthenticated = require("../Middleware/isAuthenticated");
//const admin = require("../Middleware/admin");
// * API Endpoints -->

// * get all teams
/*router.get("/admin/all", admin, async(req, res) => {
    let teams = await Team.find();
    let eventTeams = await EventTeam.find().populate({
        path: "components",
        populate: {
            path: "comp",
        },
    });
    const teamMap = {};
    teams = teams.filter(
        (team) => team.toJSON().event.toString() === process.env.EVENT_ID
    );
    eventTeams.forEach((t) => {
        teamMap[t.team] = t;
    });
    // console.log({ teams, teamMap });
    res.send({ teams, teamMap });
});*/

//get a team
router.get("/myTeam", isAuthenticated, async (req, res) => {
    const myTeam = req.user;
    if (!myTeam) return res.status(404).send("No Team Found");
    // console.log(myTeammates)
    res.send({"teamName": myTeam.teamName, "members": myTeam.members});
});


// // * get a transaction
// router.get("/team/:transaction_id", async (req, res) => {
//   const { transaction_id } = req.params;
//   const transactions = await Transaction.findById(transaction_id);
//   res.send(transactions);
// });

//* Create a team (create code)
//! cant create if already in a team
// router.post("/create", limiter, isAuthenticated, async(req, res) => {
//     const { teamName } = req.body;
//     //! validation
//     console.log(teamName);
//     if (req.user.team) return res.send(400).status("Already in a team");
//     console.log(req.user.name);
//     const uidgen = new UIDGenerator(40, UIDGenerator.BASE62);
//     const gencode = await uidgen.generate();
//     //! try catch due to unique name
//     const team = new Team({
//         teamName,
//         inviteCode: gencode, //! shorten and make alpha numeric
//         leader: req.user._id,
//         members: [req.user._id],
//     });

//     req.user.team = team._id;

//     await req.user.save();

//     await team.save(); //! add to member model
//     res.send({ name: team.name, code: team.inviteCode });
// });
//! expire codes?
//! validations

//* Join team
//! cant join if already iin a team

router.get("/join/:code", isAuthenticated, async(req, res) => {
    if (req.user.team) return res.send(400).status("Already in a team");
    const { code } = req.params;
    const team = await Team.findOne({ inviteCode: code });
    if (!team) return res.status(400).send("INVALID CODE");
    //   if(indefine)
    if (team.members.length >= process.env.TEAM_SIZE)
        return res.status(400).send("Team already full");

    if (
        team.members.findIndex(
            (memberId) => String(memberId) === String(req.user._id)
        ) !== -1
    )
        return res.status(400).send("Already added to the team");

    req.user.team = team._id;
    await req.user.save();

    team.members.push(req.user._id);

    if (team.members.length >= process.env.TEAM_SIZE) team.code = "-";
    await team.save();
    res.send(team);
});

module.exports = router;