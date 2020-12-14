const fs = require("fs");
const mysql = require("mysql");
const express = require("express");
const cors = require("cors");
const fastcsv = require("fast-csv");

//initilize const for express
const app = express();

//run cors
app.use(cors());

//create db connection
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", //change your password here
});

//process csv data
let stream = fs
  .createReadStream("testData--www-linkresearchtools-com.csv")
  .on("error", (error) => console.error(error));

let csvData = [];

let csvStream = fastcsv
  .parse({
    delimiter: ",",
    skipLines: 1,
  })
  .on("data", function (record) {
    csvData.push(record);
  })
  .on("end", (rowCount) => {
    console.log(`Parsed ${rowCount} rows`);

    //create database and table if it doesnt exist
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected to MySQL");

      //drop DB if exist
      con.query("DROP DATABASE IF EXISTS mydxc");

      //create db
      con.query("CREATE DATABASE mydxc", function (err, result) {
        if (err) throw err;
        console.log("Database created or skipped if exists");
      });

      con.query("USE mydxc");

      //create table
      const sql =
        "CREATE TABLE IF NOT EXISTS newDXCtable (Favorites TEXT, From_URL TEXT, To_URL TEXT, anchor_text TEXT, link_status TEXT, Type TEXT, bl_dom TEXT, DomPop TEXT, Power TEXT,  Trust TEXT,  Power_Trust TEXT,  Alexa TEXT, IP TEXT, CNTRY TEXT)";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table created or skipped if exists");
      });

      //insert data to table
      let query =
        "INSERT INTO newDXCtable (Favorites, From_URL, To_URL, anchor_text, link_status, Type, bl_dom, DomPop, Power, Trust, Power_Trust, Alexa, IP, CNTRY ) VALUES ?";
      con.query(query, [csvData], (error, response) => {
        console.log(error || response);
      });
    });
  });

stream.pipe(csvStream);

//fetch data
app.get("/getdata", (req, res) => {
  let sql = "SELECT * FROM mydxc.newdxctable";
  con.query(sql, (err, results) => {
    if (err) throw err;
    let result = JSON.parse(JSON.stringify(results));
    console.log("result: ", result);
    res.send(result);
  });
});

//start the server
app.listen("3001", () => {
  console.log("Server has started on port 3001");
});
