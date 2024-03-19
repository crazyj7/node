var express = require('express');
var router = express.Router();
const db = require('../tmpdb') ;
const jwt = require('jsonwebtoken')


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get('/login', (req, res) => {
    // res.send('token login test') ;
    var errmsg = req.query['errmsg'] ;
    res.render('login_jwt', {errmsg: errmsg}) ;
});




router.post('/loginproc', function(req, res) {
    console.log('/loginproc ', req.body);
    const { userid, userpwd } = req.body ;
    console.log(`${userid} ${userpwd}`) ;
    const userinfo = db.users.find( u => u.id===req.body.userid ) ;
    if ( !userinfo ) {
      console.log("not found user") ;
      res.redirect('/jwt/login?errmsg=IDFAIL')
      return 
    }
    if ( userinfo.pwd != req.body.userpwd ) {
      console.log("pwd no match ", userinfo.pwd, req.body.userpwd) ;
      res.redirect('/jwt/login?errmsg=PWDFAIL')
      return 
    }
    console.log('login ok.');

    // 토큰 발급
    // access token 발급
    const aToken = jwt.sign( {
        id : userinfo.id,
    }, process.env.ACCESS_SECRET, 
    {
        expiresIn : '1m',
        issuer : 'cj'
    })
    // refresh token 발급
    const rToken = jwt.sign( {
        id : userinfo.id,
    }, process.env.REFRESH_SECRET, 
    {
        expiresIn : '24h',
        issuer : 'cj'
    })

    // token 전송
    res.cookie('aToken', aToken, {
        secure : false,
        httpOnly : true,
    }) ;
    res.cookie('rToken', rToken, {
        secure : false,
        httpOnly : true,
    }) ;
    res.redirect('/jwt/home')
  }) ;


  router.post('/refreshtoken', (req, res) => {
    console.log('refreshtoken') ;
    // 토큰 재발급.
    try {
        const token = req.cookies.rToken ;
        const data = jwt.verify(token, process.env.REFRESH_SECRET)        
        console.log(data) ;
        // access token 재발급.
        const aToken = jwt.sign( {
            id : data.id,
        }, process.env.ACCESS_SECRET, 
        {
            expiresIn : '1m',
            issuer : 'cj'
        })
        // token 전송
        res.cookie('aToken', aToken, {
            secure : false,
            httpOnly : true,
        }) ;
        console.log("AccessToken ReCreated!");
        res.send(JSON.stringify({RESULT:1})) ;
    } catch (error) {
        console.log(error) ;
        res.send(JSON.stringify({RESULT:0})) ;
    }
  })

  router.get('/home', (req, res) => {
    var data={}
    // acess token 검증.
    // 토큰 검증.
    try {
        const token = req.cookies.aToken ;
        data = jwt.verify(token, process.env.ACCESS_SECRET) ;
        console.log('verify ok', data) ;
    } catch (error) {
        console.log('verify fail', error) ;
        // 토큰 만료. 또는 검증실패. 

        // refresh token 으로 자동갱신해보고 안되면, logout.
        // res.render('refresh_jwt')        // 자동 토큰갱신... 

        // refresh 하지 않고, 만료되면 로그인을 다시 해야하도록 할 수도... 
        // 이 경우라면  rToken(refreshToken)은 전부 삭제해도 된다. 
        // res.render('login_jwt', {errmsg:''}) ; // URL창이 바뀌지 않음. 
        res.redirect('/jwt/login'); // URL창이 변경됨. 

        return 
    }

    res.render('home_jwt', {loginId:data.id}) ;
  }) ;


  router.get('/logout', (req, res)=>{
    res.clearCookie('aToken');
    res.render('login_jwt', {errmsg:''}) ;
  }) ;

  


module.exports = router;
