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
  