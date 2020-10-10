const express = require('express')
const sqlite3 = require('sqlite3')
const bodyParser = require('body-parser')
const app = express()
const PORT = process.env.PORT || 4000
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')
app.use(bodyParser.json())
app.listen(PORT)
module.exports = app

app.param('employeeId', (req, res, next, employeeId) => {
  db.get('SELECT * FROM Employee WHERE id = $employeeId', {$employeeId: employeeId}, (err, row) => {
    if (err) {
      next(err)
    } else if (row) {
      req.employee = row
      next()
    } else {
      res.status(404).send()
    }
  })
})

app.get('/api/employees', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (err, rows) => {
    res.json({employees: rows})
  })
})

app.post('/api/employees', (req, res, next) => {
  let { name, position, wage, isCurrentEmployee } = req.body.employee
  isCurrentEmployee = isCurrentEmployee === 0 ? 0 : 1
  if (!name || !position || !wage) {
    return res.sendStatus(400)
  }

  db.run(
    `INSERT INTO Employee (name, position, wage, is_current_employee)
     VALUES ($name, $position, $wage, $isCurrentEmployee)`,
    {
      $name: name,
      $position: position,
      $wage: wage,
      $isCurrentEmployee: isCurrentEmployee
    },
    function(err) {
      if (err) {
        next(err)
      } else {
        db.get(
          'SELECT * FROM Employee WHERE id=$id',
          {$id: this.lastID},
          (error, employee) => {
            res.status(201).json({employee: employee})
          }
        )
      }
    }
  )
})

app.get('/api/employees/:employeeId', (req, res, next) => {
  res.json({employee: req.employee})
})

app.put('/api/employees/:employeeId', (req, res, next) => {
  let { name, position, wage, isCurrentEmployee } = req.body.employee
  isCurrentEmployee = isCurrentEmployee === 0 ? 0 : 1
  if (!name || !position || !wage) {
    return res.sendStatus(400)
  }

  db.run(
    `UPDATE Employee
     SET name=$name, position=$position, wage=$wage, is_current_employee=$isCurrentEmployee
     WHERE id=$id`,
    {
      $name: name,
      $position: position,
      $wage: wage,
      $isCurrentEmployee: isCurrentEmployee,
      $id: req.employee.id
    },
    err => {
      if (err) {
        next(err)
      } else {
        db.get(
          'SELECT * FROM Employee WHERE id=$id',
          {$id: req.employee.id},
          (error, employee) => {
            res.status(200).json({employee: employee})
          }
        )
      }
    }
  )
})

app.delete('/api/employees/:employeeId', (req, res, next) => {
  db.run(
    `UPDATE Employee SET is_current_employee=0 WHERE id=$id`,
    {
      $id: req.employee.id
    },
    function(err) {
      if (err) {
        next(err)
      } else {
        db.get(
          'SELECT * FROM Employee WHERE id=$id',
          {$id: req.employee.id},
          (error, employee) => {
            res.status(200).json({employee: employee})
          }
        )
      }
    }
  )
})

app.get('/api/employees/:employeeId/timesheets', (req, res, next) => {
  db.all(
    'SELECT * FROM Timesheet WHERE employee_id = $employeeId',
    {$employeeId: req.employee.id},
    (err, rows) => {
      res.json({timesheets: rows})
    }
  )
})

app.post('/api/employees/:employeeId/timesheets', (req, res, next) => {
  let { hours, rate, date } = req.body.timesheet
  if (!hours || !rate || !date) {
    return res.sendStatus(400)
  }

  db.run(
    `INSERT INTO Timesheet (hours, rate, date, employee_id)
     VALUES ($hours, $rate, $date, $employeeId)`,
    {
      $hours: hours,
      $rate: rate,
      $date: date,
      $employeeId: req.employee.id
    },
    function(err) {
      if (err) {
        next(err)
      } else {
        db.get(
          'SELECT * FROM Timesheet WHERE id=$id',
          {$id: this.lastID},
          (error, timesheet) => {
            res.status(201).json({timesheet: timesheet})
          }
        )
      }
    }
  )
})

app.param('timesheetId', (req, res, next, timesheetId) => {
  db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', {$timesheetId: timesheetId}, (err, row) => {
    if (err) {
      next(err)
    } else if (row) {
      req.timesheet = row
      next()
    } else {
      res.status(404).send()
    }
  })
})


app.put('/api/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  let { hours, rate, date } = req.body.timesheet
  if (!hours || !rate || !date) {
    return res.sendStatus(400)
  }

  db.run(
    `UPDATE Timesheet
     SET hours=$hours, rate=$rate, date=$date
     WHERE id=$timesheetId`,
    {
      $hours: hours,
      $rate: rate,
      $date: date,
      $timesheetId: req.timesheet.id
    },
    err => {
      if (err) {
        next(err)
      } else {
        db.get(
          'SELECT * FROM Timesheet WHERE id=$id',
          {$id: req.timesheet.id},
          (error, timesheet) => {
            res.status(200).json({timesheet: timesheet})
          }
        )
      }
    }
  )
})

app.delete('/api/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  db.run(
    `DELETE FROM Timesheet WHERE id=$id`,
    {
      $id: req.timesheet.id
    },
    function(err) {
      if (err) {
        next(err)
      } else {
        res.sendStatus(204)
      }
    }
  )
})

