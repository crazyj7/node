var express = require('express');
var router = express.Router();
var escapeHtml = require('escape-html') ;

const db = require('../tmpdb') ;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res) {
  console.log('/login') ;
  console.log('session=', req.session) ;
  var saveerr = req.session.err ;

  // 권한 검사.
  if ( req.session.userid && req.session.loginok ) {
    console.log("auth ok") ;
    res.redirect('/home') ;
    return ;
  }  

  // console.log('err=', req.query['err']) ; URL query 파라미터 받기.
  req.session.err='' ;
  
  res.render('login', { errmsg : saveerr} ) ;
}) ;

router.post('/loginproc', function(req, res) {
  console.log('/loginproc ', req.body);
  console.log('session=', req.session) ;
  const { userid, userpwd } = req.body ;
  console.log(`${userid} ${userpwd}`) ;
  const userinfo = db.users.find( u => u.id===req.body.userid ) ;
  if ( !userinfo ) {
    console.log("not found user") ;
//    res.send(JSON.stringify({msg:'not found user'})) ;
    delete req.session.userid ;
    req.session.loginok=false ;
    req.session.err = 'IDFAIL';
    req.session.save( (err)=> {
      if (err) return next(err)
      console.log('session save')
      res.redirect('/login')
    }) ;
    return ;
  }
  if ( userinfo.pwd != req.body.userpwd ) {
    console.log("pwd no match ", userinfo.pwd, req.body.userpwd) ;
//    res.send(JSON.stringify({msg:'no match pwd'})) ;
    delete req.session.userid ;
    req.session.loginok=false ;
    req.session.err = 'PWDFAIL';
    req.session.save( (err)=> {
      if (err) return next(err)
      console.log('session save')
      res.redirect('/login')
    }) ;
    return ;
  }
  console.log('login ok.');
  req.session.userid = userinfo.id ;
  req.session.loginok=true ;
  req.session.err='' ;
  req.session.save(function (err) {
    if (err) return next(err)
    console.log('session save')
    res.redirect('/home')
  }) ;
  
}) ;



router.get('/home', (req, res, next)=>{

  // 권한 검사.
  if ( req.session.userid && req.session.loginok ) {
    console.log("auth ok") ;
    res.render('home', {loginId: req.session.userid}) 
  }
  else {
    console.log('auth fail') ;
    res.redirect('/login') ;
  }

}) ;

router.get('/logout', (req, res, next) => {
  delete req.session.userid ;
  req.session.err='' ;
  req.session.loginok=false ;
  req.session.save(function (err) {
    if (err) return next(err)
    console.log('session save')
    res.redirect('/login')
  }) ;
  return ;
}) ;

///////////////////////////////////////////////////////////////////////////


router.get("/testejs", (req, res)=>{
  res.render("testejs", { var1 : 'hello world', 
    varlist1 : [ {name:'jason', age:10}, {name:'jimmy', age:15 }] }) ;
})



module.exports = router;
 