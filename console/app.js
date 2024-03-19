// 환경설정파일 로딩
require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var jwtRouter = require("./routes/jwt");
var apiRouter = require("./routes/api");
var cors = require("cors");
var app = express();
var session = require("express-session");

app.use(
  cors({
    origin: true,   // 출처허용옵션 :  true, '*' 등.
    credentials: true,  // 응답헤더에 access-control-allow-credentials 
  })
);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("keyboard cat"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    // https 라면 secure: true.  ; 맞지 않으면 쿠키에 connect.sid가 저장되지 않아서 세션유지가 안됨.
    cookie: {
      secure: false,
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: true,
      path: "/",
    },
  })
);

app.use("/", indexRouter);
app.use("/jwt", jwtRouter);
app.use("/api", apiRouter);

indexRouter.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);
indexRouter.use(
  "/@fortawesome",
  express.static(path.join(__dirname, "node_modules/@fortawesome"))
)
jwtRouter.use(
  "/axios",
  express.static(path.join(__dirname, "node_modules/axios/dist"))
);
apiRouter.use(
  "/axios",
  express.static(path.join(__dirname, "node_modules/axios/dist"))
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
