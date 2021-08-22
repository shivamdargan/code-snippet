const express = require("express");
const router = express.Router();
const passport = require("passport");

// * Login or Register
router.get(
    "/login",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        failureRedrect: `${process.env.CLIENT_URL}/`,
    })
);

// * Callback uri for google login
router.get("/login/callback", (req, res, next) => {
    passport.authenticate(
        "google", {
            scope: ["profile", "email"],
        },
        function(err, user, info) {
            if (!user)
                return res.redirect(
                    `${process.env.CLIENT_URL}/error?err=${info?.message}`
                );
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
            });
        }
    )(req, res, next);
});

// * Logout
router.get("/logout", (req, res) => {
    req.logout();
    res.redirect(`${process.env.CLIENT_URL}`);
});

module.exports = router;