const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// FILE UPLOAD
const upload = multer({ dest: "uploads/" });

// DB
const db = new sqlite3.Database('./placement.db');

// TABLES
db.run(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS students(
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    branch TEXT,
    cgpa REAL,
    resume TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS companies(
    id INTEGER PRIMARY KEY,
    name TEXT,
    role TEXT,
    package REAL
)`);

db.run(`CREATE TABLE IF NOT EXISTS placements(
    id INTEGER PRIMARY KEY,
    student_id INTEGER,
    company_id INTEGER
)`);

// REGISTER
app.post('/register', (req,res)=>{
    const {username,password}=req.body;
    db.run("INSERT INTO users(username,password) VALUES(?,?)",
    [username,password],
    err=>{
        if(err) return res.send("User exists");
        res.send("Registered");
    });
});

// LOGIN
app.post('/login',(req,res)=>{
    const {username,password}=req.body;
    db.get("SELECT * FROM users WHERE username=? AND password=?",
    [username,password],
    (err,row)=>{
        res.json({success: !!row});
    });
});

// ADD STUDENT + RESUME
app.post('/add-student', upload.single('resume'), (req,res)=>{
    const {name,email,branch,cgpa} = req.body;

    const resume = req.file ? req.file.filename : null;

    db.run(
        "INSERT INTO students(name,email,branch,cgpa,resume) VALUES(?,?,?,?,?)",
        [name,email,branch,cgpa,resume],
        ()=> res.send("Student Added")
    );
});

// GET STUDENTS
// GET STUDENTS WITH STATUS ✅ FIX
app.get('/students',(req,res)=>{
    const query = `
    SELECT students.*, companies.name AS company_name
    FROM students
    LEFT JOIN placements 
        ON students.id = placements.student_id
    LEFT JOIN companies 
        ON placements.company_id = companies.id
    `;

    db.all(query,[],(err,rows)=>{
        res.json(rows);
    });
});
// ADD COMPANY
app.post('/add-company',(req,res)=>{
    const {name,role,package}=req.body;
    db.run("INSERT INTO companies(name,role,package) VALUES(?,?,?)",
    [name,role,package],
    ()=>res.send("Company added"));
});

// GET COMPANIES
app.get('/companies',(req,res)=>{
    db.all("SELECT * FROM companies",[],(err,rows)=>{
        res.json(rows);
    });
});

// RECOMMENDATION (simple logic)
app.get('/recommend/:cgpa',(req,res)=>{
    const cgpa = req.params.cgpa;

    let query = cgpa >= 8
        ? "SELECT * FROM companies WHERE package >= 8"
        : "SELECT * FROM companies WHERE package < 8";

    db.all(query,[],(err,rows)=>{
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});
// DELETE STUDENT ✅ FIX
app.delete('/delete-student/:id', (req,res)=>{
    db.run("DELETE FROM students WHERE id=?", [req.params.id], function(err){
        if(err) return res.send(err.message);
        res.send("Deleted");
    });
});
// PLACE STUDENT ✅ FIX
app.post('/place-student',(req,res)=>{
    const {student_id, company_id} = req.body;

    db.run(
        "DELETE FROM placements WHERE student_id=?",
        [student_id],
        ()=>{
            db.run(
                "INSERT INTO placements(student_id, company_id) VALUES(?,?)",
                [student_id, company_id],
                ()=>res.send("Placed")
            );
        }
    );
});
// DELETE COMPANY
// DELETE COMPANY (SAFE)
app.delete('/delete-company/:id', (req, res) => {
    const companyId = req.params.id;

    // 🔍 Check if any student is placed in this company
    db.get(
        "SELECT * FROM placements WHERE company_id=?",
        [companyId],
        (err, row) => {
            if (row) {
                return res.send("Cannot delete - Students already placed!");
            }

            // ✅ If no placements, delete company
            db.run(
                "DELETE FROM companies WHERE id=?",
                [companyId],
                function(err) {
                    if (err) return res.send("Error deleting company");
                    res.send("Company Deleted");
                }
            );
        }
    );
});