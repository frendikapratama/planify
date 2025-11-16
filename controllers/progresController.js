import Task from "../models/Task.js";
import { handleError } from "../utils/errorHandler.js";
import Group from "../models/Group.js";
import Project from "../models/Project.js";

// export async function getProgresByProject(req, res) {
//   try {
//     const { projectId } = req.params;

//     const groups = await Group.find({ project: projectId });
//     const groupIds = groups.map((group) => group._id);

//     const tasks = await Task.find({
//       groups: { $in: groupIds },
//     });

//     if (!projectId) {
//       return res.status(400).json({
//         success: false,
//         message: "Project  tidak ditemukan",
//       });
//     }
//     const total = tasks.length;
//     const done = tasks.filter((t) => t.status === "Done").length;
//     const to_do = tasks.filter((t) => t.status === "To Do").length;
//     const Hold = tasks.filter((t) => t.status === "Hold").length;
//     const reject = tasks.filter((t) => t.status === "Reject").length;
//     const in_progress = tasks.filter((t) => t.status === "In Progress").length;

//     const progress = total === 0 ? 0 : (done / total) * 100;

//     res.json({
//       success: true,
//       progress: Math.round(progress),
//       totalTask: total,
//       done,
//       in_progress,
//       to_do,
//       Hold,
//       reject,
//     });
//   } catch (error) {
//     return handleError(res, error);
//   }
// }

export async function getProgresByProject(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project tidak ditemukan",
      });
    }

    // 1. Ambil grup berdasarkan project
    const groups = await Group.find({ project: projectId });
    const groupIds = groups.map((g) => g._id);

    // 2. Ambil task berdasarkan grup
    const tasks = await Task.find({ groups: { $in: groupIds } });

    // Jika project tidak punya grup atau task
    if (groups.length === 0) {
      return res.json({
        success: true,
        progress: 0,
        groups: [],
        totalTask: 0,
      });
    }

    let totalTaskProject = 0;
    let weightedProgressSum = 0;

    const groupProgressList = [];

    for (let group of groups) {
      const tasksInGroup = tasks.filter(
        (t) => String(t.groups) === String(group._id)
      );

      const totalTaskGroup = tasksInGroup.length;
      const doneTaskGroup = tasksInGroup.filter(
        (t) => t.status === "Done"
      ).length;

      const progressGroup =
        totalTaskGroup === 0 ? 0 : (doneTaskGroup / totalTaskGroup) * 100;

      // simpan untuk detail response
      groupProgressList.push({
        groupId: group._id,
        groupName: group.name,
        progress: Math.round(progressGroup),
        totalTask: totalTaskGroup,
        done: doneTaskGroup,
      });

      // akumulasi weighted
      totalTaskProject += totalTaskGroup;
      weightedProgressSum += progressGroup * totalTaskGroup;
    }

    // 3. Hitung progress project dari rata-rata weighted grup
    const finalProgress =
      totalTaskProject === 0 ? 0 : weightedProgressSum / totalTaskProject;

    res.json({
      success: true,
      progress: Math.round(finalProgress),
      totalTask: totalTaskProject,
      groups: groupProgressList,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getProgresByGroup(req, res) {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group tidak ditemukan",
      });
    }

    const tasks = await Task.find({ groups: groupId });

    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "Done").length;
    const to_do = tasks.filter((t) => t.status === "To Do").length;
    const Hold = tasks.filter((t) => t.status === "Hold").length;
    const reject = tasks.filter((t) => t.status === "Reject").length;
    const in_progress = tasks.filter((t) => t.status === "In Progress").length;
    const progress = total === 0 ? 0 : (done / total) * 100;

    res.json({
      success: true,
      data: {
        groupId: group._id,
        groupName: group.nama,
        groupDescription: group.description,
        progress: Math.round(progress),
        totalTask: total,
        done,
        in_progress,
        to_do,
        Hold,
        reject,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// export async function getProgresByWorkspace(req, res) {
//   try {
//     const { workspaceId } = req.params;

//     if (!workspaceId) {
//       return res.status(400).json({
//         success: false,
//         message: "Workspace tidak ditemukan",
//       });
//     }

//     const projects = await Project.find({ workspace: workspaceId });
//     if (projects.length === 0) {
//       return res.json({
//         success: true,
//         data: {
//           workspaceId,
//           totalProject: 0,
//           totalTask: 0,
//           completedTask: 0,
//           progress: 0,
//           projects: [],
//         },
//       });
//     }

//     const projectIds = projects.map((p) => p._id);

//     const groups = await Group.find({ project: { $in: projectIds } });
//     const groupIds = groups.map((g) => g._id);

//     const tasks = await Task.find({ groups: { $in: groupIds } });

//     const totalTask = tasks.length;
//     const completedTask = tasks.filter((t) => t.status === "Done").length;
//     const progress = totalTask === 0 ? 0 : (completedTask / totalTask) * 100;

//     const projectsProgress = await Promise.all(
//       projects.map(async (project) => {
//         const projectGroups = groups.filter(
//           (g) => g.project.toString() === project._id.toString()
//         );
//         const projectGroupIds = projectGroups.map((g) => g._id);

//         const projectTasks = await Task.find({
//           groups: { $in: projectGroupIds },
//         });

//         const projectTotal = projectTasks.length;
//         const projectDone = projectTasks.filter(
//           (t) => t.status === "Done"
//         ).length;

//         const projectProgress =
//           projectTotal === 0 ? 0 : (projectDone / projectTotal) * 100;

//         return {
//           projectId: project._id,
//           projectName: project.nama,
//           totalTask: projectTotal,
//           completedTask: projectDone,
//           progress: Math.round(projectProgress),
//         };
//       })
//     );

//     res.json({
//       success: true,
//       data: {
//         workspaceId,
//         totalProject: projects.length,
//         totalTask,
//         completedTask,
//         progress: Math.round(progress),
//         projects: projectsProgress,
//       },
//     });
//   } catch (error) {
//     return handleError(res, error);
//   }
// }

export async function getProgresByWorkspace(req, res) {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace tidak ditemukan",
      });
    }

    // Ambil semua project dalam workspace
    const projects = await Project.find({ workspace: workspaceId });

    const totalProject = projects.length;

    // Jika belum ada project
    if (totalProject === 0) {
      return res.json({
        success: true,
        data: {
          workspaceId,
          totalProject: 0,
          completedProject: 0,
          inProgressProject: 0,
          undatedProject: 0,
          progress: 0,
          projects: [],
        },
      });
    }

    const projectIds = projects.map((p) => p._id);

    // Ambil group berdasarkan project
    const groups = await Group.find({ project: { $in: projectIds } });

    // Hitung progress per project
    const projectsProgress = await Promise.all(
      projects.map(async (project) => {
        const projectGroupIds = groups
          .filter((g) => g.project.toString() === project._id.toString())
          .map((g) => g._id);

        const projectTasks = await Task.find({
          groups: { $in: projectGroupIds },
        });

        const totalTask = projectTasks.length;
        const completedTask = projectTasks.filter(
          (t) => t.status === "Done"
        ).length;

        const percent =
          totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

        return {
          projectId: project._id,
          projectName: project.nama,
          totalTask,
          completedTask,
          progress: percent,
          isCompleted: percent === 100,
        };
      })
    );

    // Hitung kategori
    const completedProject = projectsProgress.filter(
      (p) => p.isCompleted
    ).length;
    const inProgressProject = projectsProgress.filter(
      (p) => p.progress > 0 && p.progress < 100
    ).length;
    const undatedProject = projectsProgress.filter(
      (p) => p.progress === 0
    ).length;

    // Progress workspace berdasarkan jumlah project yang selesai
    const workspaceProgress = Math.round(
      (completedProject / totalProject) * 100
    );

    // Response akhir
    res.json({
      success: true,
      data: {
        workspaceId,
        totalProject, // ← ini diminta
        completedProject, // selesai 100%
        inProgressProject, // progress > 0 && < 100
        undatedProject, // progress == 0
        progress: workspaceProgress,
        projects: projectsProgress,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}
