// ================= POPUP =================
function showPopup(title, message){
    document.getElementById("popupTitle").innerText = title;
    document.getElementById("popupText").innerText = message;
    document.getElementById("popup").style.display = "flex";

    // AUTO CLOSE AFTER 5 SECONDS
    setTimeout(() => {
        closePopup();
    }, 5000);
}

function closePopup(){
    document.getElementById("popup").style.display = "none";
}

// ================= LOGIN =================
function login(){
    const username = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

    fetch('http://localhost:3000/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
    })
    .then(res=>res.json())
    .then(data=>{
        if(data.success){
            showPopup("Success","Login Successful 🎉");
            setTimeout(()=> window.location.href="dashboard.html",1500);
        } else {
            showPopup("Error","Invalid login");
        }
    })
    .catch(()=> showPopup("Error","Server not running"));
}

// ================= REGISTER =================
function register(){
    const username = document.getElementById("regUsername")?.value;
    const password = document.getElementById("regPassword")?.value;

    fetch('http://localhost:3000/register',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
    })
    .then(res=>res.text())
    .then(msg=>{
        showPopup("Success", msg);
        setTimeout(()=> window.location.href="login.html",1500);
    });
}

// ================= ADD STUDENT =================
function addStudent(){
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const branch = document.getElementById("branch").value;
    const cgpa = document.getElementById("cgpa").value;
    const resume = document.getElementById("resume").files[0];

    if(!name || !email || !branch || !cgpa){
        showPopup("Error","Fill all fields");
        return;
    }

    // ✅ IMPORTANT: use FormData
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("branch", branch);
    formData.append("cgpa", cgpa);

    if(resume){
        formData.append("resume", resume);
    }

    fetch('http://localhost:3000/add-student',{
        method:'POST',
        body: formData   // ❌ no headers here
    })
    .then(()=> {
        showPopup("Success","Student Added 🎉");

        // clear fields
        document.getElementById("name").value="";
        document.getElementById("email").value="";
        document.getElementById("branch").value="";
        document.getElementById("cgpa").value="";
        document.getElementById("resume").value="";

        loadStudents();
    })
    .catch(()=>{
        showPopup("Error","Upload failed");
    });
}
// ================= LOAD STUDENTS =================
function loadStudents(){
    fetch('http://localhost:3000/students')
    .then(res=>res.json())
    .then(data=>{
        const filter = document.getElementById("filterStatus").value;
        const table = document.getElementById("studentTable");
        table.innerHTML="";

        data.forEach(s=>{
            if(filter==="placed" && !s.company_name) return;
            if(filter==="notPlaced" && s.company_name) return;

            table.innerHTML+=`
            <tr>
                <td>${s.name}</td>
                <td>${s.email}</td>
                <td>${s.branch}</td>
                <td>${s.cgpa}</td>

                <td>
                    <button onclick="deleteStudent(${s.id})">❌</button>
                </td>

                <!-- ✅ UPDATED PART -->
                <td>
                    <select id="company-${s.id}" ${s.company_name ? "disabled" : ""}></select>

                    ${!s.company_name 
                        ? `<button onclick="placeStudent(${s.id})">Place</button>`
                        : `<span style="color:green; font-weight:bold;">✔ Done</span>`
                    }
                </td>

                <td>
                    <button onclick="recommend(${s.cgpa})">🎯</button>
                </td>

                <td>
                    ${s.company_name 
                        ? "✅ Placed in " + s.company_name 
                        : "❌ Not Placed"}
                </td>
            </tr>`;
        });

        // IMPORTANT
        loadCompanyDropdowns();
    });
}
// DELETE
function deleteStudent(id){
    fetch(`http://localhost:3000/delete-student/${id}`,{method:'DELETE'})
    .then(()=>{
        showPopup("Deleted","Student removed");
        loadStudents();
    });
}

// PLACE
function placeStudent(studentId){

    const companyId = document.getElementById(`company-${studentId}`).value;

    fetch('http://localhost:3000/place-student',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
            student_id: studentId,
            company_id: companyId
        })
    })
    .then(()=>{
        showPopup("Success","Student placed successfully 🎉");
        loadStudents();
    });
}

// RECOMMEND
function recommend(cgpa){
    let msg="";

    if(cgpa>=9) msg="🔥 Top Companies (Google, Microsoft)";
    else if(cgpa>=8) msg="💼 MNC Companies";
    else msg="📚 Improve skills";

    showPopup("Recommended", msg);
}

// ================= COMPANY =================
function addCompany(){
    const name = document.getElementById("cname").value;
    const role = document.getElementById("role").value;
    const packageValue = document.getElementById("package").value;

    if(!name || !role || !packageValue){
        showPopup("Error","Fill all fields");
        return;
    }

    fetch('http://localhost:3000/add-company',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({name,role,package:packageValue})
    })
    .then(()=>{
        showPopup("Success","Company Added 🎉");

        document.getElementById("cname").value="";
        document.getElementById("role").value="";
        document.getElementById("package").value="";

        loadCompanies();
    });
}

function loadCompanies(){
    fetch('http://localhost:3000/companies')
    .then(res=>res.json())
    .then(data=>{
        const table = document.getElementById("companyTable");
        if(!table) return;

        table.innerHTML="";

        data.forEach(c=>{
            table.innerHTML += `
            <tr>
                <td>${c.name}</td>
                <td>${c.role}</td>
                <td>${c.package}</td>
                <td>
                    <button onclick="deleteCompany(${c.id})">❌</button>
                </td>
            </tr>`;
        });
    });
}

// ================= DARK MODE =================
function toggleDarkMode(){
    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){
        localStorage.setItem("mode","dark");
    } else {
        localStorage.setItem("mode","light");
    }
}

// ================= LOGOUT =================
function logout(){
    showPopup("Logout","Logged out");
    setTimeout(()=> window.location.href="login.html",1500);
}

// ================= AUTO LOAD =================
window.onload = function(){

    if(localStorage.getItem("mode")==="dark"){
        document.body.classList.add("dark");
    }

    if(document.getElementById("studentTable")){
        loadStudents();
    }

    if(document.getElementById("companyTable")){
        loadCompanies();
    }
};
function loadCompanyDropdowns(){
    fetch('http://localhost:3000/companies')
    .then(res=>res.json())
    .then(companies=>{

        document.querySelectorAll("[id^='company-']").forEach(select=>{

            const studentId = select.id.split("-")[1];

            select.innerHTML = "";

            companies.forEach(c=>{
                select.innerHTML += `
                    <option value="${c.id}">${c.name}</option>
                `;
            });

        });

    });
}
function deleteCompany(id){
    fetch(`http://localhost:3000/delete-company/${id}`, {
        method:'DELETE'
    })
    .then(res => res.text())
    .then(msg => {
        showPopup("Info", msg);   // 🔥 show backend message
        loadCompanies();
     })
      .catch(() => {
        showPopup("Error", "Delete failed");
    });
}