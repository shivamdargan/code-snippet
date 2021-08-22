// const express = require('express');
// const app = express();
// const passport = require('passport');
// const bcrypt = require('bcrypt');
// //const session = require('express-session');
// const { login } = require("../Middleware/hasTeamID");
// const { register } = require("../utils/validation/validators");
// const Participant = require("../models/Event");
// const router = express.Router();

// // * Auth Callback
// router.get("/auth/callback", (req, res, next) => {
//     passport.authenticate(
//         "google", {
//             scope: ["profile", "email"],
//         },
//         function(err, user, info) {
//             console.log(err, user, info);
//             if (!user)
//                 return res.redirect(
//                     `${process.env.CLIENT_URL}/error?err=${info?.message}`
//                 );
//             req.logIn(user, function(err) {
//                 if (err) {
//                     return next(err);
//                 }
//                 return res.redirect(`${process.env.CLIENT_URL}/`);
//             });
//         }
//     )(req, res, next);
// });
// //login
// router.get(
//     "/login",
//     (req, res, next) => {
//         req.session.route = "login";
//         return next();
//     },
//     passport.authenticate("google", { scope: ["profile", "email"] })
// );
// //loadout
// router.get("/profile", login, async(req, res) => {
//     try {
//         const user = await Participant.findById(req.user._id)
//             .populate("teams")
//             .exec();
//         if (!user)
//             return res.status(404).json({ body: null, error: "User does not exist" });

//         return res.status(200).json({ body: user, error: null });
//     } catch (error) {
//         console.error("Error occured here \n", error);
//         return res.status(500).json({ body: null, error: "Server Error." });
//     }
// });
// //logout
// router.get("/logout", async(req, res) => {
//     try {
//         req.logout();
//         res.redirect(process.env.CLIENT_URL);
//     } catch (error) {
//         console.error("Error occured here \n", error);
//         return res.status(500).json({ body: null, error: "Server Error." });
//     }
// });
// module.exports = router;