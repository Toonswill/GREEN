const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INVESTMENTS_FILE = path.join(DATA_DIR, 'investments.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files
if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(INVESTMENTS_FILE)) fs.writeFileSync(INVESTMENTS_FILE, JSON.stringify([]));

// Projects
function getProjects() {
    const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
}

function saveProjects(projects) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function addProject(project) {
    const projects = getProjects();
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const newProject = { ...project, id: newId };
    projects.push(newProject);
    saveProjects(projects);
    return newProject;
}

function updateProject(id, updates) {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        projects[index] = { ...projects[index], ...updates };
        saveProjects(projects);
        return projects[index];
    }
    return null;
}

function getProjectById(id) {
    const projects = getProjects();
    return projects.find(p => p.id === id);
}

// Users
function getUsers() {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function addUser(user) {
    const users = getUsers();
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = { ...user, id: newId };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

function updateUser(id, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        saveUsers(users);
        return users[index];
    }
    return null;
}

function getUserByEmail(email) {
    const users = getUsers();
    return users.find(u => u.email === email);
}

function getUserById(id) {
    const users = getUsers();
    return users.find(u => u.id === id);
}

// Investments
function getInvestments() {
    const data = fs.readFileSync(INVESTMENTS_FILE, 'utf8');
    return JSON.parse(data);
}

function saveInvestments(investments) {
    fs.writeFileSync(INVESTMENTS_FILE, JSON.stringify(investments, null, 2));
}

function addInvestment(investment) {
    const investments = getInvestments();
    const newId = investments.length > 0 ? Math.max(...investments.map(i => i.id)) + 1 : 1;
    const newInvestment = { ...investment, id: newId };
    investments.push(newInvestment);
    saveInvestments(investments);
    return newInvestment;
}

function updateInvestment(id, updates) {
    const investments = getInvestments();
    const index = investments.findIndex(i => i.id === id);
    if (index !== -1) {
        investments[index] = { ...investments[index], ...updates };
        saveInvestments(investments);
        return investments[index];
    }
    return null;
}

module.exports = {
    getProjects, saveProjects, addProject, updateProject, getProjectById,
    getUsers, saveUsers, addUser, updateUser, getUserByEmail, getUserById,
    getInvestments, saveInvestments, addInvestment, updateInvestment
};