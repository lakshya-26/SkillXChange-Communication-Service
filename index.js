require('dotenv').config();
const { httpServer } = require('./app');

const PORT = process.env.PORT || 3002; // Default to 3002 to avoid conflict with User Service (usually 3000/3001)

httpServer.listen(PORT, () => {
  console.log(`Communication Service running on port ${PORT}`);
});
