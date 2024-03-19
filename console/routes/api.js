var express = require("express");
var router = express.Router();
// var mysql = require('mysql');
// var mysql2 = require('mysql2');
var mysql2 = require("mysql2/promise");

//
// var conn = mysql2.createConnection({
//     host : 'localhost',
//     port: 3306,
//     user: 'crazyj7',
//     password: 'crazyj700.',
//     database: 'DB_TEST'
// })
const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000, // ms
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
});

/* GET users listing. */
router.get("/", function (req, res, next) {
  // res.send('respond with a resource');
  res.render("api/usage");
});

router.get("/addhtml", (req, res) => {
  res.render("api/addhtml");
});

router.post("/add", (req, res) => {
  console.log(req.body);

  var { A, B } = req.body;
  var c = Number(A) + Number(B);

  var outdata = { RESULT: c };
  // res.json({RESULT:c}) ;
  res.send(JSON.stringify(outdata)); // 상동.
});


const getConnection = async () => {
    try {
        const conn = await pool.getConnection() ;
        console.log("getConnection") ;
        return conn ;
    } catch (err) {
        console.error('db connect failed. ', err) ;
        return null ;
    }
}

const releaseConnection = async (conn) => {
    try {
        console.log("releaseConnection") ;
        await conn.release() ;
    } catch (err) {
        console.error('db release error.') ;
    }
}

// MYSQL test
router.get("/mysqltest", async (req, res) => {
  console.log("/mysqltest");
  // conn.connect() ;
  const conn = await getConnection() ;

  /*
    접속 실패. 원인?? mysql 계정 암호인증 방식이.
    caching_sha2_password 인데, client 는 그렇지 않음.
    둘(서버, 클라이언트) 중 하나를 수정해야 함. 

    서버쪽을 수정하려면.
        alter user 'root'@'%' identified with mysql_native_password by 'password'
        이렇게 하여 인증방식을 mysql_native_password 방식으로 변경.
    클라이언트를 수정하려면..
        mysql2 모듈을 사용한다.

    */
  // conn.query('SELECT * from TDATA', (err, rows, fields)=>{
  //     if ( err )
  //         throw err ;
  //     console.log('result =', rows) ;
  //     res.send(rows) ;
  // } ) ;
  const [rows] = await conn.query("SELECT * from TDATA");
  console.log("result =", rows);

  const [rows3] = await conn.query("SELECT COUNT(*) from TDATA");
//   console.log("result =", rows3);

// 키명을 알고 있으면 아래와 같이... 함수명보다 가급적 뒤에 AS를 추가하여 사용하는게 편리함.
//   var firstkey = rows3[0] ;
//   console.log('cnt=', firstkey['COUNT(*)']);

// key, value 탐색.
var cnt = '' ;
  for (var k in rows3[0]) {
    console.log(k, rows3[0][k]) ;
    cnt = rows3[0][k] ;
  }

  // select where
  var name = "ADDRESS";
  const [rows2] = await conn.query(
    "SELECT * from TDATA WHERE NAME=?",
    [name]
  );
  console.log(rows2) ;
  // insert
  var post = { NAME: cnt, VALUE: "what" };
  await conn.query("INSERT INTO TDATA SET ?", post);
  // conn.end() ;
  // conn.release();   // conn 사용후 반드시 release를 해줘야 한다. 
  releaseConnection(conn) ;

  res.send(rows2);
});


// MYSQL test
router.get("/mysqltest2", async (req, res) => {
    console.log("/mysqltest2. transaction");
    // conn.connect() ;
    const conn = await getConnection() ;

    try {
        await conn.beginTransaction() ;

        // to do.
        var [rows1] = await conn.query('SELECT COUNT(*) AS CNT FROM TDATA') ;
        var cnt = rows1[0]['CNT']

        var up = { NAME : '10', VALUE : 'change'+cnt}
        await conn.query("UPDATE TDATA SET ? WHERE NAME=?", [up, '10']) ;

        await conn.query("INSERT TDATA SET ?", {NAME:'newname', VALUE:'xxx'}) ;

        const [rows] = await conn.query("SELECT * FROM TDATA") ;
        await conn.commit() ;
        res.send(rows) ;
    } catch(err) {
        // 쿼리 중 중간에 실패하면 롤백된다. 
        
        if ( conn ) {
            console.log("ROLLBACK") ;
            conn.rollback() ;
        }
        res.send("rollback") ;

    } finally {
        if ( conn ) {
            releaseConnection(conn) ;
        }
    }

}) ;


module.exports = router;
