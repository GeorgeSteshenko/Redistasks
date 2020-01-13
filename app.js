const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const redis = require("redis");

app = express();

// Create Client
const client = redis.createClient();

client.on("connect", function() {
	console.log("Redis server connected...");
});

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
	let title = "Task List";

	client.lrange("tasks", 0, -1, function(err, reply) {
		client.hgetall("call", function(err, call) {
			res.render("index", {
				title,
				tasks: reply,
				call
			});
		});
	});
});

app.post("/task/add", function(req, res) {
	let task = req.body.task;

	client.rpush("tasks", task, function(err, reply) {
		if (err) {
			console.log(err);
		}
		console.log("Task added...");
		res.redirect("/");
	});
});

app.post("/task/delete", function(req, res) {
	let tasksToDel = req.body.tasks;

	client.lrange("tasks", 0, -1, function(err, tasks) {
		for (let i = 0; i < tasks.length; i++) {
			if (tasksToDel.indexOf(tasks[i]) > -1) {
				client.lrem("tasks", 0, tasks[i], function() {
					if (err) {
						console.log(err);
					}
				});
			}
		}
		res.redirect("/");
	});
});

app.post("/call/add", function(req, res) {
	let newCall = {};

	newCall.name = req.body.name;
	newCall.company = req.body.company;
	newCall.phone = req.body.phone;
	newCall.time = req.body.time;

	client.hmset(
		"call",
		[
			"name",
			newCall.name,
			"company",
			newCall.company,
			"phone",
			newCall.phone,
			"time",
			newCall.time
		],
		function(err, reply) {
			if (err) console.log(err);
			console.log(reply);
			res.redirect("/");
		}
	);
});

// Port
const port = 3000;

app.listen(port, function() {
	console.log(`Server started on ${port}...`);
});
