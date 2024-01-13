const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

app.use(bodyParser.json());

let USERS = [];
let ADMIN = [];
let COURSES = [];

var userSecret = "iufgb23ejkf";
var adminSecret = "hjavbt3nkj";

const generateUserjwt = (user) => {
  let payload = { username: user.username };
  return jwt.sign(payload, userSecret, { expiresIn: "1h" });
};

const generateAdminjwt = (admin) => {
  let payload = { username: admin.username };
  return jwt.sign(payload, adminSecret, { expiresIn: "1h" });
};

const authenticateUserJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const authToken = authHeader.split(" ")[1];

    jwt.verify(authToken, userSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    return res.json({ message: "Authentication for user failed" });
  }
};

const authenticateAdminJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const authToken = authHeader.split(" ")[1];

    jwt.verify(authToken, adminSecret, (err, admin) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = admin;
      next();
    });
  } else {
    return res.json({ message: "Authentication for admin failed" });
  }
};

app.post("/admin/signup", (req, res) => {
  const admin = req.body;
  const existingAdmin = ADMIN.find((a) => a.username === admin.username);
  if (existingAdmin) {
    res.status(403).json({ message: "Admin already exists" });
  }
  ADMIN.push(admin);
  res.json({ message: "Admin created successfully", admin });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  let admin = ADMIN.find(
    (a) => a.username === username && a.password === password
  );
  if (admin) {
    let token = generateAdminjwt(admin);
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(403).json({ message: "admin authentication failed" });
  }
});

app.post("/admin/course", authenticateAdminJwt, (req, res) => {
  const course = req.body;
  // COURSES.push({...course,id:COURSES.length+1})
  course.id = Date.now();
  COURSES.push(course);
  res.json({ message: "Course created successfully", courseId: course.id });
});

app.put("/admin/course/:courseId", authenticateAdminJwt, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const courseIndex = COURSES.findIndex((c) => c.id === courseId);

  if (courseIndex > -1) {
    const updatedCourse = { ...COURSES[courseIndex], ...req.body };
    COURSES[courseIndex] = updatedCourse;
    res.json({ message: "Course updated successfully" });
  } else {
    res.status(401).json({ message: "Course not found" });
  }
});

app.get("/admin/course", authenticateAdminJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.post("/user/signup", (req, res) => {
  const user = req.body;
  const existingUser = USERS.find((u) => u.username === user.username);
  if (existingUser) {
    res.status(401).json({ message: "User already exist" });
  }
  USERS.push(user);
  res.json({ message: "User created successfully", user });
});

app.post("/user/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    let token = generateUserjwt(user);
    res.status(200).json({ message: "user logged in", token });
  }
  res.status(403).json({ message: "User authentication failed" });
});

app.get("/user/course", authenticateUserJwt, (req, res) => {
  res.json({ course: COURSES });
});

app.post("/user/course/:courseId", authenticateUserJwt, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  console.log("Itthe aagaya");
  const course = COURSES.find((c) => c.id === courseId);
  if (course) {
    let user = USERS.find((u) => u.username === req.user.username);
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(course);
      res.status(200).json({ message: "Course purchased successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } else {
    res.status(404).json({ message: "Course does not exist" });
  }
});

app.get("/user/course/purchasedcourse", authenticateUserJwt, (req, res) => {
  const user = USERS.find((u) => u.username === req.user.username);
  if (user && user.purchasedCourses) {
    res.json({ purchasedCourses: user.purchasedCourses });
  } else {
    res.json({ message: "No course purchased" });
  }
});

app.listen(3000, () => {
  console.log("server running on port 3000");
});
