import Task from "../models/Task.js";
import { handleError } from "../utils/errorHandler.js";
import Group from "../models/Group.js";
import Project from "../models/Project.js";

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

//     const projects = await Project.find({
//       $or: [{ workspace: workspaceId }, { otherWorkspaces: workspaceId }],
//     });

//     const totalProject = projects.length;

//     if (totalProject === 0) {
//       return res.json({
//         success: true,
//         data: {
//           workspaceId,
//           totalProject: 0,
//           completedProject: 0,
//           inProgressProject: 0,
//           undatedProject: 0,
//           progress: 0,
//           projects: [],
//         },
//       });
//     }

//     const projectIds = projects.map((p) => p._id);
//     const groups = await Group.find({ project: { $in: projectIds } });

//     const projectsProgress = await Promise.all(
//       projects.map(async (project) => {
//         const projectGroupIds = groups
//           .filter((g) => g.project.toString() === project._id.toString())
//           .map((g) => g._id);

//         const projectTasks = await Task.find({
//           groups: { $in: projectGroupIds },
//         });

//         const totalTask = projectTasks.length;
//         const completedTask = projectTasks.filter(
//           (t) => t.status === "Done"
//         ).length;

//         const percent =
//           totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

//         const isOwned = project.workspace.toString() === workspaceId;

//         return {
//           projectId: project._id,
//           projectName: project.nama,
//           totalTask,
//           completedTask,
//           progress: percent,
//           isCompleted: percent === 100,
//           projectType: isOwned ? "owned" : "collaborated",
//         };
//       })
//     );

//     // Hitung project berdasarkan status
//     const completedProject = projectsProgress.filter(
//       (p) => p.isCompleted
//     ).length;
//     const inProgressProject = projectsProgress.filter(
//       (p) => p.progress > 0 && p.progress < 100
//     ).length;
//     const undatedProject = projectsProgress.filter(
//       (p) => p.progress === 0
//     ).length;

//     // Hitung progres workspace dengan rata-rata progres semua project
//     // Bukan hanya berdasarkan jumlah project selesai
//     const totalProgress = projectsProgress.reduce(
//       (sum, project) => sum + project.progress,
//       0
//     );
//     const workspaceProgress = Math.round(totalProgress / totalProject);

//     res.json({
//       success: true,
//       data: {
//         workspaceId,
//         totalProject,
//         completedProject,
//         inProgressProject,
//         undatedProject,
//         progress: workspaceProgress,
//         projects: projectsProgress,
//       },
//     });
//   } catch (error) {
//     return handleError(res, error);
//   }
// }

// export async function getProgresByWorkspace(req, res) {
//   try {
//     const { workspaceId } = req.params;
//     if (!workspaceId) {
//       return res.status(400).json({
//         success: false,
//         message: "Workspace tidak ditemukan",
//       });
//     }

//     const projects = await Project.find({
//       $or: [{ workspace: workspaceId }, { otherWorkspaces: workspaceId }],
//     });

//     const totalProject = projects.length;

//     if (totalProject === 0) {
//       return res.json({
//         success: true,
//         data: {
//           workspaceId,
//           totalProject: 0,
//           completedProject: 0,
//           inProgressProject: 0,
//           undatedTask: 0,
//           plannedTask: 0,
//           progress: 0,
//           projects: [],
//         },
//       });
//     }

//     const projectIds = projects.map((p) => p._id);
//     const groups = await Group.find({ project: { $in: projectIds } });

//     // Hitung undated dan planned dari semua task di workspace
//     const allGroupIds = groups.map((g) => g._id);
//     const allTasks = await Task.find({ groups: { $in: allGroupIds } });

//     const undatedTask = allTasks.filter(
//       (t) => !t.due_date || t.due_date === null
//     ).length;

//     const plannedTask = allTasks.filter((t) => t.note === "Planning").length;

//     const projectsProgress = await Promise.all(
//       projects.map(async (project) => {
//         const projectGroupIds = groups
//           .filter((g) => g.project.toString() === project._id.toString())
//           .map((g) => g._id);

//         const projectTasks = await Task.find({
//           groups: { $in: projectGroupIds },
//         });

//         const totalTask = projectTasks.length;
//         const completedTask = projectTasks.filter(
//           (t) => t.status === "Done"
//         ).length;

//         const percent =
//           totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

//         const isOwned = project.workspace.toString() === workspaceId;

//         return {
//           projectId: project._id,
//           projectName: project.nama,
//           totalTask,
//           completedTask,
//           progress: percent,
//           isCompleted: percent === 100,
//           projectType: isOwned ? "owned" : "collaborated",
//         };
//       })
//     );

//     // Hitung project berdasarkan status
//     const completedProject = projectsProgress.filter(
//       (p) => p.isCompleted
//     ).length;
//     const inProgressProject = projectsProgress.filter(
//       (p) => p.progress > 0 && p.progress < 100
//     ).length;
//     const notStartedProject = projectsProgress.filter(
//       (p) => p.progress === 0
//     ).length;

//     // Hitung progres workspace dengan rata-rata progres semua project
//     const totalProgress = projectsProgress.reduce(
//       (sum, project) => sum + project.progress,
//       0
//     );
//     const workspaceProgress = Math.round(totalProgress / totalProject);

//     res.json({
//       success: true,
//       data: {
//         workspaceId,
//         totalProject,
//         completedProject,
//         inProgressProject,
//         notStartedProject,
//         undatedTask,
//         plannedTask,
//         progress: workspaceProgress,
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

    const projects = await Project.find({
      $or: [{ workspace: workspaceId }, { otherWorkspaces: workspaceId }],
    });

    const totalProject = projects.length;

    if (totalProject === 0) {
      return res.json({
        success: true,
        data: {
          workspaceId,
          totalProject: 0,
          completedProject: 0,
          inProgressProject: 0,
          planningProject: 0,
          undatedProject: 0,
          undatedTask: 0,
          progress: 0,
          projects: [],
        },
      });
    }

    const projectIds = projects.map((p) => p._id);
    const groups = await Group.find({ project: { $in: projectIds } });

    // Hitung undated task dari semua task di workspace
    // const allGroupIds = groups.map((g) => g._id);
    // const allTasks = await Task.find({ groups: { $in: allGroupIds } });

    // const undatedTask = allTasks.filter(
    //   (t) => !t.due_date || t.due_date === null
    // ).length;

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

        // Cek apakah semua task dalam project adalah status "To Do" dengan note "Planning"
        const allTasksPlanning =
          totalTask > 0 &&
          projectTasks.every(
            (t) => t.status === "To Do" && t.note === "Planning"
          );

        // Cek apakah semua task dalam project adalah status "Hold" atau "Blocked" dengan note "Planning"
        const allTasksUndated =
          totalTask > 0 &&
          projectTasks.every(
            (t) =>
              (t.status === "Hold" || t.status === "Blocked") &&
              t.note === "Planning"
          );

        const percent =
          totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

        const isOwned = project.workspace.toString() === workspaceId;

        return {
          projectId: project._id,
          projectName: project.nama,
          totalTask,
          completedTask,
          progress: percent,
          isCompleted: percent === 100,
          isPlanning: allTasksPlanning,
          isUndated: allTasksUndated,
          projectType: isOwned ? "owned" : "collaborated",
        };
      })
    );

    // Hitung project berdasarkan status
    const completedProject = projectsProgress.filter(
      (p) => p.isCompleted
    ).length;

    const planningProject = projectsProgress.filter((p) => p.isPlanning).length;

    const undatedProject = projectsProgress.filter((p) => p.isUndated).length;

    const inProgressProject = projectsProgress.filter(
      (p) => !p.isPlanning && !p.isUndated && p.progress > 0 && p.progress < 100
    ).length;

    const notStartedProject = projectsProgress.filter(
      (p) => !p.isPlanning && !p.isUndated && p.progress === 0
    ).length;

    // Hitung progres workspace dengan rata-rata progres semua project
    const totalProgress = projectsProgress.reduce(
      (sum, project) => sum + project.progress,
      0
    );
    const workspaceProgress = Math.round(totalProgress / totalProject);

    res.json({
      success: true,
      data: {
        workspaceId,
        totalProject,
        completedProject,
        inProgressProject,
        notStartedProject,
        planned: planningProject,
        undatedProject,
        // undatedTask,
        progress: workspaceProgress,
        projects: projectsProgress,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}
