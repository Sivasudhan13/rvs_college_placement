const router = require('express').Router();
const {
  getRoadmap, updateRoadmap, updateStepStatus,
} = require('../controllers/roadmapController');
const { protect } = require('../middleware/auth');

router.get  ('/',      protect, getRoadmap);
router.put  ('/',      protect, updateRoadmap);
router.patch('/step',  protect, updateStepStatus);

module.exports = router;
