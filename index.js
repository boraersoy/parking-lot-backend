const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const app = express();
const port = 3001;

app.use(cors())
app.use(express.json());

// Connect to local MongoDB
mongoose.connect('mongodb+srv://dedeninpepesi:21012002Bora@parkinglotcluster.z1sfl.mongodb.net/parking', {
   useNewUrlParser: true,
   useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

const CarSchema = new mongoose.Schema({
    licensePlate: {
        type: String, 
        required: true,
        unique: true,
        match: /^[A-Z]{3}[0-9]{3}$/,
        validate: {
            validator: function(v) {
              return /^[A-Z]{3}[0-9]{3}$/.test(v); // Additional validation if needed
            },
            message: props => `${props.value} is not a valid license plate format. It should be in "ABC123" format.`
          }
        
    },
    arrivalDate: Date,
    status: String, //inside or deported
    charge: Number
})

const Car = mongoose.model('Car', CarSchema);

function validateLicensePlate(licensePlate) {
    // Regex validation
    const regex = /^[A-Z]{3}[0-9]{3}$/;
    if (!regex.test(licensePlate)) {
      return { isValid: false, message: "Invalid license plate format. It should be in format ABC123" };
    }
    return { isValid: true };
  }
app.post('/cars', async (req, res) => {
    try {
        const licensePlate = req.body.licensePlate;
    
        // Validate license plate using the function
        const validation = validateLicensePlate(licensePlate);
        if (!validation.isValid) {
          return res.status(400).send(validation.message);
        }
  
      // Additional backend logic (e.g., checking if car already exists)
      const existingCar = await Car.findOne({ licensePlate: licensePlate, status: 'inside' });
      if (existingCar) return res.status(400).send("Car is already in the park");
  
      // Save car to the database
      const car = new Car({ licensePlate:licensePlate, arrivalDate: new Date(), status: 'inside', charge: 0 });
      await car.save();
      res.status(201).send(car);
    } catch (error) {
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  

//deport a car

app.post('/deport', async (req, res) => {
    try {
        const licensePlate = req.body.licensePlate;
    
        // Validate license plate using the function
        const validation = validateLicensePlate(licensePlate);
        if (!validation.isValid) {
          return res.status(400).send(validation.message);
        }
    const car = await Car.findOne({ licensePlate: req.body.licensePlate });
    if (!car || car.status !== 'inside') return res.status(400).send('Car not found or already deported.');

    const hoursParked = (new Date() - car.arrivalDate) / 1e5;
    const charge = hoursParked * 5;
    car.charge = charge;
    car.status = 'deported';
    await car.save();

    res.send(car);
    }
    catch (error) {
        res.status(500).send({ message: 'Internal server error' });
      }
});
app.post('/deported', async (req, res) => {
  try {
      const licensePlate = req.body.licensePlate;
  
      // Validate license plate using the function
      const validation = validateLicensePlate(licensePlate);
      if (!validation.isValid) {
        return res.status(400).send(validation.message);
      }

    // Additional backend logic (e.g., checking if car already exists)
    const existingCar = await Car.findOne({ licensePlate: licensePlate, status: 'deported' });
    if (existingCar) return res.status(400).send("Car is already deported ");

    // Save car to the database
    const car = new Car({ licensePlate:licensePlate, arrivalDate: new Date(), status: 'deported', charge: Math.floor(Math.random() * 1000)});
    await car.save();
    res.status(201).send(car);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
})


app.get('/cars', async (req, res) => {
    const cars = await Car.find({status: 'inside'});
    res.send(cars);
});

app.get('/revenue', async (req, res) => {
    const deportedCars = await Car.find({status: 'deported'});
    const totalRevenue  = deportedCars.reduce((sum, car) => sum + car.charge, 0 );
    res.send({ totalRevenue});
})
app.get('/deported', async (req, res) => {
    const deportedCars = await Car.find({ status: 'deported' });
    res.send(deportedCars);
 });
app.get("/", (req, res) => {
    res.send("Hello Express!");
})

app.listen(port, () =>{
    console.log(`Server is running on localhost ${port}`)
})

// Example using Fetch API to add 50 objects to your API
const addCarsTest = async () => {
  for (let i = 1; i <= 50; i++) {
    // Generate random letters and numbers for the license plate in ABC123 format
    const randomPlate = `${getRandomLetter()}${getRandomLetter()}${getRandomLetter()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const data = {
      licensePlate: randomPlate, // Random letters and numbers in ABC123 format
    };
    console.log(data.licensePlate)
    await fetch('http://localhost:3001/cars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => console.log('Added:', json))
      .catch((error) => console.error('Error:', error.message));
  }
};
const departCarTest = async () => {
  for (let i = 1; i <= 50; i++) {
    // Generate random letters and numbers for the license plate in ABC123 format
    const randomPlate = `${getRandomLetter()}${getRandomLetter()}${getRandomLetter()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const data = {
      licensePlate: randomPlate, // Random letters and numbers in ABC123 format
    };

    await fetch('http://localhost:3001/deported', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => console.log('Added:', json))
      .catch((error) => console.error('Error:', error.message));
  }
};


const getRandomLetter = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
};
// Sleep function that returns a promise
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// Example usage in an async function
const example = async () => {
  await sleep(10000); // Sleep for 2 seconds (2000 milliseconds)

  addCarsTest();
  await sleep(5000); // Sleep for 2 seconds (2000 milliseconds)
  departCarTest();
};

example();


