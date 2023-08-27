const fs = require('fs');
const express = require('express');
const app = express();
const PORT = 2006;

const HISTORY_FILE = 'history.json';

let history = [];

// Load history from file if it exists


if (fs.existsSync(HISTORY_FILE)) {
  const fileData = fs.readFileSync(HISTORY_FILE, 'utf8');
  history = JSON.parse(fileData);
}

app.get('/', (req, res) => {   // to handle the get request
  const query = req.query.q;

  if (query) {
    const result = evaluateExpression(query);  // to evaluate the expression passes 

    if (result !== null) {
      

      history.push({ question: query, answer: result });

      if (history.length > 20) {  // if length of history goes above 20 it will be shifted
        history.shift();
      }

      saveHistory();

      res.json({ question: query, answer: result }); // to give the response of the request
    } else {
      res.status(400).send('Invalid expression');  
    }
  } else {
    res.send('Please provide a valid query.');
  }
});

app.get('/history', (req, res) => {
  loadHistory();

  const htmlList = history  // to give history of operation in html format 
    .map(item => `<li>${item.question} = ${item.answer}</li>`)
    .join('');

  const htmlResponse = `
    <html>
      <head><title>History of  Operations</title></head>
      <body>
        <h1>History of Operations</h1>
        <ul>
          ${htmlList}
        </ul>
      </body>
    </html>
  `;

  res.send(htmlResponse);
});

function saveHistory() {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history), 'utf8');
}

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    const fileData = fs.readFileSync(HISTORY_FILE, 'utf8');
    history = JSON.parse(fileData);
  }
}

function evaluateExpression(expression) {  // evaluating expression according to precedence 
  try {
    const tokens = expression.split('/');
    const operators = { 'plus': 1, 'minus': 1, 'into': 2, 'over': 2 };

    const postfix = [];
    const operatorStack = [];

    for (const token of tokens) {
      if (token in operators) {
        while (operatorStack.length && operators[operatorStack[operatorStack.length - 1]] >= operators[token]) {
          postfix.push(operatorStack.pop());
        }
        operatorStack.push(token);
      } else {
        postfix.push(parseFloat(token));
      }
    }

    while (operatorStack.length) {
      postfix.push(operatorStack.pop());
    }

    const evalStack = [];
    for (const token of postfix) {
      if (typeof token === 'number') {
        evalStack.push(token);
      } else {
        const b = evalStack.pop();
        const a = evalStack.pop();
        switch (token) {
          case 'plus':
            evalStack.push(a + b);
            break;
          case 'minus':
            evalStack.push(a - b);
            break;
          case 'into':
            evalStack.push(a * b);
            break;
          case 'over':
            evalStack.push(a / b);
            break;
        }
      }
    }

    return evalStack[0];
  } catch (error) {
    return null;
  }
}


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});