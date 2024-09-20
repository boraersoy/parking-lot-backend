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
        unique: false,
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
      console.log(existingCar);
      if (existingCar) return res.status(400).send("Car is already in the park");
      
      // Save car to the database
      const car = new Car({ licensePlate:licensePlate, arrivalDate: new Date(), status: 'inside', charge: 0 });
      await car.save();
      res.status(201).send(car);
    } catch (error) {
      res.status(500).send({ message: error.message});
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
    const car = await Car.findOne({ licensePlate: req.body.licensePlate, status: "inside" });
    if (!car || car.status !== 'inside') return res.status(400).send('Car not found .');

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
  const { q, _sort = 'licensePlate', _order = 'asc', _page = 1, _limit = 10 } = req.query;

  // Base query object
  let query = { status: 'inside' };

  // Search query (for licensePlate)
  if (q) {
    query.$or = [
      { licensePlate: { $regex: q, $options: 'i' } }, // Case-insensitive search
    ];
  }

  // Sorting logic
  const sortField = _sort;
  const sortOrder = _order === 'desc' ? -1 : 1;

  try {
    // Pagination: Convert _page and _limit to numbers
    const totalCount = await Car.countDocuments(query);
    const page = parseInt(_page);
    const limit = parseInt(_limit);
    const skip = (page - 1) * limit;

    // Fetch and sort cars with pagination
    const cars = await Car.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Send paginated cars along with total count in the response body
    res.send({
      cars,
      totalCount,
    });
  } catch (error) {
    res.status(500).send({ message: 'Server error', error });
  }
});




app.get('/revenue', async (req, res) => {
    const deportedCars = await Car.find({status: 'deported'});
    const totalRevenue  = deportedCars.reduce((sum, car) => sum + car.charge, 0 );
    res.send({ totalRevenue});
})
app.get('/deported', async (req, res) => {
  const { q, _sort = 'licensePlate', _order = 'asc', _page = 1, _limit = 10 } = req.query;

  // Base query object
  let query = { status: 'deported' };

  // Search query (for all columns, assuming 'title' and 'licensePlate' as examples)
  if (q) {
    query.$or = [
      { licensePlate: { $regex: q, $options: 'i' } }, // Case-insensitive search on license plate
    //  { arrivalDate: { $regex: q, $options: 'i' } }  Case-insensitive search on title
    ];
  }

  // Sorting logic
  const sortField = _sort; // Field to sort by
  const sortOrder = _order === 'desc' ? -1 : 1; // Sort order: default ascending

  try {
    // Pagination: Convert _page and _limit to numbers
    const totalCount = await Car.countDocuments(query);
    const page = parseInt(_page);
    const limit = parseInt(_limit);
    const skip = (page - 1) * limit;

    // Fetch and sort cars with pagination
    const cars = await Car.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Send paginated cars along with total count in the response body
    res.send({
      cars,
      totalCount,
    });
  } catch (error) {
    res.status(500).send({ message: 'Server error', error });
  }
});


app.get("/", (req, res) => {
    res.send("Hello Express!");
})

app.listen(port, () =>{
    console.log(`Server is running on localhost ${port}`)
})

// Example using Fetch API to add 50 objects to your API


