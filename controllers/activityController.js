import Activity from "../models/Activity.js";

export async function getAllActivity(req, res) {
  try {
    const logs = await Activity.find()
      .populate("user", "username email")
      .populate("project", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    // Transform logs untuk handle deleted tasks
    const transformedLogs = logs.map((log) => {
      const logObj = log.toObject();

      // Cek di before atau after
      if (!logObj.task) {
        const taskName = logObj.before?.taskName || logObj.after?.taskName;
        const taskId = logObj.before?.taskId || logObj.after?.taskId;

        if (taskName) {
          logObj.task = {
            _id: taskId || null,
            nama: taskName,
          };
        }
      }

      return logObj;
    });

    res.status(200).json({ success: true, logs: transformedLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getActivityByUser(req, res) {
  try {
    const { userId } = req.params;
    const logs = await Activity.find({ user: userId })
      .populate("project", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    const transformedLogs = logs.map((log) => {
      const logObj = log.toObject();

      if (!logObj.task) {
        const taskName = logObj.before?.taskName || logObj.after?.taskName;
        const taskId = logObj.before?.taskId || logObj.after?.taskId;

        if (taskName) {
          logObj.task = {
            _id: taskId || null,
            nama: taskName,
          };
        }
      }

      return logObj;
    });

    res.status(200).json({ success: true, logs: transformedLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getActivityByGroup(req, res) {
  try {
    const { groupId } = req.params;
    const logs = await Activity.find({ group: groupId })
      .populate("user", "username email")
      .populate("group", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    const transformedLogs = logs.map((log) => {
      const logObj = log.toObject();

      if (!logObj.task) {
        const taskName = logObj.before?.taskName || logObj.after?.taskName;
        const taskId = logObj.before?.taskId || logObj.after?.taskId;

        if (taskName) {
          logObj.task = {
            _id: taskId || null,
            nama: taskName,
          };
        }
      }

      return logObj;
    });

    res.status(200).json({
      success: true,
      logs: transformedLogs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getActivityByProject(req, res) {
  try {
    const { projectId } = req.params;
    const logs = await Activity.find({ project: projectId })
      .populate("user", "username email")
      .populate("group", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    const transformedLogs = logs.map((log) => {
      const logObj = log.toObject();

      if (!logObj.task) {
        const taskName = logObj.before?.taskName || logObj.after?.taskName;
        const taskId = logObj.before?.taskId || logObj.after?.taskId;

        if (taskName) {
          logObj.task = {
            _id: taskId || null,
            nama: taskName,
          };
        }
      }

      return logObj;
    });

    res.status(200).json({
      success: true,
      logs: transformedLogs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getActivityByKuarter(req, res) {
  try {
    const { kuarterId } = req.params;

    if (!kuarterId) {
      return res.status(400).json({
        success: false,
        message: "Kuarter ID wajib disertakan",
      });
    }

    const logs = await Activity.find({ kuarter: kuarterId })
      .populate("user", "username email")
      .populate("kuarter", "nama tahun")
      .populate("workspace", "nama")
      .populate("project", "nama")
      .populate("group", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    const transformedLogs = logs.map((log) => {
      const logObj = log.toObject();

      if (!logObj.task) {
        const taskName = logObj.before?.taskName || logObj.after?.taskName;
        const taskId = logObj.before?.taskId || logObj.after?.taskId;

        if (taskName) {
          logObj.task = {
            _id: taskId || null,
            nama: taskName,
          };
        }
      }

      return logObj;
    });

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil activity berdasarkan kuarter",
      count: transformedLogs.length,
      logs: transformedLogs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getActivityByKuarterWithFilters(req, res) {
  try {
    const { kuarterId } = req.params;
    const {
      action,
      userId,
      workspaceId,
      projectId,
      groupId,
      startDate,
      endDate,
    } = req.query;

    if (!kuarterId) {
      return res.status(400).json({
        success: false,
        message: "Kuarter ID wajib disertakan",
      });
    }

    // Build filter object
    const filter = { kuarter: kuarterId };

    if (action) filter.action = action;
    if (userId) filter.user = userId;
    if (workspaceId) filter.workspace = workspaceId;
    if (projectId) filter.project = projectId;
    if (groupId) filter.group = groupId;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await Activity.find(filter)
      .populate("user", "username email")
      .populate("kuarter", "nama tahun")
      .populate("workspace", "nama")
      .populate("project", "nama")
      .populate("group", "nama")
      .populate("task", "nama")
      .sort({ createdAt: -1 });

    const transformedLogs = logs.map((log) => {
      const logObj = log.toObject();

      if (!logObj.task) {
        const taskName = logObj.before?.taskName || logObj.after?.taskName;
        const taskId = logObj.before?.taskId || logObj.after?.taskId;

        if (taskName) {
          logObj.task = {
            _id: taskId || null,
            nama: taskName,
          };
        }
      }

      return logObj;
    });

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil activity berdasarkan kuarter dengan filter",
      count: transformedLogs.length,
      filters: {
        action,
        userId,
        workspaceId,
        projectId,
        groupId,
        startDate,
        endDate,
      },
      logs: transformedLogs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
