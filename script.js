// 1. SELECTING HTML ELEMENTS

const expenseForm = document.getElementById("expenseForm");

const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");

const expenseList = document.getElementById("expenseList");

const totalExpenses = document.getElementById("totalExpenses");
const totalTransactions = document.getElementById("totalTransactions");
const expenseCount = document.getElementById("expenseCount");

const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");

const budgetInput = document.getElementById("budgetInput");
const setBudgetBtn = document.getElementById("setBudgetBtn");

const monthlyBudget = document.getElementById("monthlyBudget");
const remainingBudget = document.getElementById("remainingBudget");

const budgetProgress = document.getElementById("budgetProgress");
const budgetPercentage = document.getElementById("budgetPercentage");
const budgetMessage = document.getElementById("budgetMessage");

const categorySummary = document.getElementById("categorySummary");
const currentDate = document.getElementById("currentDate");


// 2. VARIABLES

const STORAGE_KEY = "studentExpenseTrackerData";
const BUDGET_KEY = "studentExpenseTrackerBudget";

const categories = ["Food", "Travel", "Shopping", "Education", "Other"];

const categoryIcons = {
    Food: "🍔",
    Travel: "🚌",
    Shopping: "🛍️",
    Education: "📚",
    Other: "📦"
};

let expenses = [];
let budget = 5000;


// 3. LOAD DATA FROM LOCAL STORAGE

function loadData() {

    try {
        const savedExpenses = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (Array.isArray(savedExpenses)) {
            expenses = savedExpenses.filter(item =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                Number.isFinite(item.amount) &&
                item.amount > 0 &&
                categories.includes(item.category) &&
                typeof item.date === "string" &&
                !Number.isNaN(Date.parse(item.date))
            );
        }

        const savedBudget = Number(localStorage.getItem(BUDGET_KEY));

        if (Number.isFinite(savedBudget) && savedBudget > 0) {
            budget = savedBudget;
        }

    } catch (error) {
        console.error("Error loading saved data:", error);
        expenses = [];
        budget = 5000;
    }

}

// 4. SAVE DATA TO LOCAL STORAGE

function saveData() {

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        localStorage.setItem(BUDGET_KEY, String(budget));
    } catch (error) {
        alert("Unable to save data. Check your browser storage.");
        console.error("Storage error:", error);
    }

}

// 5. FORMAT AMOUNT IN INDIAN RUPEES

function formatAmount(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);

}

// 6. GET CURRENT MONTH EXPENSES

function getMonthlyExpenses() {

    const now = new Date();

    return expenses.filter(expense => {

        const expenseDate = new Date(expense.date);

        return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
        );

    });

}

// 7. DISPLAY CURRENT DATE

function displayDate() {

    currentDate.textContent = new Date().toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}

// 8. ADD NEW EXPENSE

expenseForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = expenseName.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;

    // Validate expense name
    if (name === "") {
        alert("Please enter an expense name!");
        expenseName.focus();
        return;
    }

    // Validate amount
    if (
        expenseAmount.value.trim() === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter a valid positive amount!");
        expenseAmount.focus();
        return;
    }

    // Validate category
    if (!categories.includes(category)) {
        alert("Please select a valid category!");
        expenseCategory.focus();
        return;
    }

    // Create expense object
    const newExpense = {

        id: (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) ? window.crypto.randomUUID() : (
            Date.now().toString() + Math.random().toString(36).slice(2)
        ),

        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()

    };

    // Add expense to array
    expenses.unshift(newExpense);

    // Save and update dashboard
    saveData();
    updateDashboard();

    // Clear form
    expenseForm.reset();

    alert("Expense added successfully! 🎉");

});

function displayExpenses() {

    expenseList.replaceChildren();

    const selectedCategory = categoryFilter.value;
    const searchText = searchInput.value.trim().toLowerCase();

    const filteredExpenses = expenses.filter(expense => {

        const matchesCategory =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        const matchesSearch =
            expense.name.toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;

    });

    // Show empty message
    if (filteredExpenses.length === 0) {

        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const icon = document.createElement("div");
        icon.textContent = "📭";

        const heading = document.createElement("h3");
        heading.textContent = "No Expenses Found!";

        const message = document.createElement("p");
        message.textContent = "Try adding an expense or changing your filter.";

        emptyState.append(icon, heading, message);
        expenseList.appendChild(emptyState);

    }

    // Create expense cards
    filteredExpenses.forEach(expense => {

        const expenseItem = document.createElement("div");
        expenseItem.className = "expense-item";

        // Expense information
        const expenseInfo = document.createElement("div");
        expenseInfo.className = "expense-info";

        const name = document.createElement("h4");
        name.textContent =
            `${categoryIcons[expense.category]} ${expense.name}`;

        const details = document.createElement("p");

        details.textContent =
            `${expense.category} • ${new Date(expense.date).toLocaleDateString("en-IN")}`;

        expenseInfo.append(name, details);

        // Amount
        const amount = document.createElement("span");
        amount.className = "expense-amount";
        amount.textContent = formatAmount(expense.amount);

        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "🗑 Delete";

        deleteButton.addEventListener("click", function() {

            deleteExpense(expense.id);

        });

        expenseItem.append(
            expenseInfo,
            amount,
            deleteButton
        );

        expenseList.appendChild(expenseItem);

    });

    expenseCount.textContent =
        `${filteredExpenses.length} Records`;

}

// 10. DELETE EXPENSE

function deleteExpense(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
        return;
    }

    expenses = expenses.filter(expense => expense.id !== id);

    saveData();
    updateDashboard();

}

// 11. CATEGORY FILTER

categoryFilter.addEventListener("change", function() {

    displayExpenses();

});

// 12. SEARCH EXPENSES

searchInput.addEventListener("input", function() {

    displayExpenses();

});

// 13. UPDATE TOTAL EXPENSES
function updateTotalExpenses() {

    const total = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
    );

    totalExpenses.textContent = formatAmount(total);

    totalTransactions.textContent = expenses.length;

}

// 14. SET MONTHLY BUDGET
setBudgetBtn.addEventListener("click", function() {

    const newBudget = Number(budgetInput.value);

    if (
        budgetInput.value.trim() === "" ||
        !Number.isFinite(newBudget) ||
        newBudget <= 0
    ) {

        alert("Please enter a valid positive budget!");

        budgetInput.focus();
        return;

    }

    budget = newBudget;

    saveData();
    updateBudget();

    budgetInput.value = "";

    alert("Monthly budget updated successfully! 🎯");

});

// 15. UPDATE BUDGET PROGRESS

function updateBudget() {

    const monthlyTotal = getMonthlyExpenses().reduce(
        (sum, expense) => sum + expense.amount,
        0
    );

    const remaining = budget - monthlyTotal;

    const percentage = (monthlyTotal / budget) * 100;

    monthlyBudget.textContent = formatAmount(budget);

    remainingBudget.textContent = formatAmount(remaining);

    budgetPercentage.textContent =
        `${percentage.toFixed(1)}%`;

    // Progress bar cannot exceed 100%
    budgetProgress.style.width =
        `${Math.min(percentage, 100)}%`;

    // Update budget message
    if (percentage >= 100) {

        budgetMessage.textContent =
            "⚠️ Your monthly budget has been reached or exceeded!";

        budgetProgress.style.background =
            "linear-gradient(90deg, #ef4444, #f97316)";

    } else if (percentage >= 75) {

        budgetMessage.textContent =
            "⚡ Warning! You have used most of your monthly budget.";

        budgetProgress.style.background =
            "linear-gradient(90deg, #f59e0b, #f97316)";

    } else {

        budgetMessage.textContent =
            "✅ Great! You are managing your budget well.";

        budgetProgress.style.background =
            "linear-gradient(90deg, #8b5cf6, #ec4899)";
    }

}

// 16. CATEGORY-WISE SPENDING SUMMARY
function updateCategorySummary() {

    categorySummary.replaceChildren();

    categories.forEach(category => {

        const categoryTotal = expenses
            .filter(expense => expense.category === category)
            .reduce((sum, expense) => sum + expense.amount, 0);

        const categoryCard = document.createElement("div");
        categoryCard.className = "category-item";

        const heading = document.createElement("h4");

        heading.textContent =
            `${categoryIcons[category]} ${category}`;

        const amount = document.createElement("p");

        amount.textContent = formatAmount(categoryTotal);

        categoryCard.append(heading, amount);

        categorySummary.appendChild(categoryCard);

    });

}

// 17. UPDATE COMPLETE DASHBOARD

function updateDashboard() {

    updateTotalExpenses();

    updateBudget();

    displayExpenses();

    updateCategorySummary();

}

// 18. INITIALIZE APPLICATION

function initApp() {

    loadData();

    displayDate();

    updateDashboard();

}

// Start the application
initApp();
