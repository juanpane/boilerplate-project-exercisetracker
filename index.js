const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const users = [];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: "username required" });
  const existing = users.find((u) => u.username === username);
  if (existing)
    return res.json({ username: existing.username, _id: existing._id });
  const user = { username, _id: genId(), log: [] };
  users.push(user);
  res.json({ username: user.username, _id: user._id });
});

app.get("/api/users", (req, res) => {
  res.json(users.map((u) => ({ username: u.username, _id: u._id })));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  const user = users.find((u) => u._id === id);
  if (!user) return res.status(400).json({ error: "unknown _id" });
  const description = req.body.description;
  const duration = Number(req.body.duration);
  if (!description || !req.body.duration || isNaN(duration))
    return res.status(400).json({ error: "description and duration required" });
  let dateObj;
  if (req.body.date) {
    dateObj = new Date(req.body.date);
    if (isNaN(dateObj.getTime())) dateObj = new Date();
  } else {
    dateObj = new Date();
  }
  const entry = {
    description,
    duration,
    date: dateObj.toDateString(),
    dateMs: dateObj.getTime(),
  };
  user.log.push(entry);
  res.json({
    username: user.username,
    description: entry.description,
    duration: entry.duration,
    _id: user._id,
    date: entry.date,
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  const user = users.find((u) => u._id === id);
  if (!user) return res.status(400).json({ error: "unknown _id" });
  let logs = user.log.slice();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  if (from && !isNaN(from.getTime()))
    logs = logs.filter((l) => l.dateMs >= from.getTime());
  if (to && !isNaN(to.getTime()))
    logs = logs.filter((l) => l.dateMs <= to.getTime());
  if (req.query.limit) {
    const lim = parseInt(req.query.limit);
    if (!isNaN(lim)) logs = logs.slice(0, lim);
  }
  const mapped = logs.map((l) => ({
    description: l.description,
    duration: l.duration,
    date: l.date,
  }));
  res.json({
    username: user.username,
    count: mapped.length,
    _id: user._id,
    log: mapped,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
