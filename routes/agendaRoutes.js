import express from "express";
import {
  getTasksWithMeetingDateByKuarter,
  //   getTasksWithMeetingDateInKuarterRange,
} from "../controllers/agendaController.js";

const router = express.Router();

// Get semua task dengan meeting_date berdasarkan kuarter
router.get("/kuarter/:kuarterId", getTasksWithMeetingDateByKuarter);

// Get task dengan meeting_date dalam rentang tanggal kuarter
// router.get(
//   "/kuarter/:kuarterId/tasks-in-kuarter-range",
//   getTasksWithMeetingDateInKuarterRange
// );

export default router;
