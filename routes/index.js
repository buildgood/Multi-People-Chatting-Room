var express = require('express');
var router = express.Router();
var user = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/chat', function(req, res) {
  var nickname = req.body.nickname;
  if(nickname) {
    user.push(nickname);
    res.render('chat', {name: nickname});
  }else {
    res.redirect('/');
  }

});

module.exports = router;
