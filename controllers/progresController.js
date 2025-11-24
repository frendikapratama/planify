import Task from "../models/Task.js";
import { handleError } from "../utils/errorHandler.js";
import Group from "../models/Group.js";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Kuarter from "../models/Kuarter.js";

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
    const allGroupIds = groups.map((g) => g._id);
    const allTasks = await Task.find({ groups: { $in: allGroupIds } });

    // const undatedTask = allTasks.filter(
    //   (t) => !t.due_date || t.due_date === null
    // ).length;

    const totalGroup = groups.length;

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
        totalGroup,
        // undatedTask,
        progress: workspaceProgress,
        projects: projectsProgress,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// export async function getProgresByKuarter(req, res) {
//   try {
//     const { kuarterId } = req.params;

//     // 1. Validasi kuarter
//     const kuarter = await Kuarter.findById(kuarterId);
//     if (!kuarter) {
//       return res.status(404).json({
//         success: false,
//         message: "Kuarter tidak ditemukan",
//       });
//     }

//     // 2. Ambil semua workspace dalam kuarter
//     const workspaces = await Workspace.find({ kuarter: kuarterId });
//     const totalWorkspace = workspaces.length;

//     if (totalWorkspace === 0) {
//       return res.json({
//         success: true,
//         data: {
//           kuarterId: kuarter._id,
//           kuarterName: kuarter.nama,
//           departemen: kuarter.departemen,
//           totalWorkspace: 0,
//           totalProject: 0,
//           totalTask: 0,
//           completedTask: 0,
//           progress: 0,
//           workspaces: [],
//         },
//       });
//     }

//     // 3. Ambil semua data sekaligus untuk efisiensi
//     const workspaceIds = workspaces.map((w) => w._id);

//     const allProjects = await Project.find({
//       $or: [
//         { workspace: { $in: workspaceIds } },
//         { otherWorkspaces: { $in: workspaceIds } },
//       ],
//     });

//     const projectIds = allProjects.map((p) => p._id);
//     const allGroups = await Group.find({ project: { $in: projectIds } });
//     const allGroupIds = allGroups.map((g) => g._id);
//     const allTasks = await Task.find({ groups: { $in: allGroupIds } });

//     // 4. Proses setiap workspace
//     const workspacesProgress = await Promise.all(
//       workspaces.map(async (workspace) => {
//         // Filter projects milik workspace ini
//         const workspaceProjects = allProjects.filter(
//           (p) =>
//             p.workspace.toString() === workspace._id.toString() ||
//             (p.otherWorkspaces &&
//               p.otherWorkspaces.some(
//                 (ow) => ow.toString() === workspace._id.toString()
//               ))
//         );

//         const workspaceProjectIds = workspaceProjects.map((p) => p._id);

//         // Filter groups dari projects workspace ini
//         const workspaceGroups = allGroups.filter((g) =>
//           workspaceProjectIds.some(
//             (pid) => pid.toString() === g.project.toString()
//           )
//         );

//         const workspaceGroupIds = workspaceGroups.map((g) => g._id);

//         // Filter tasks dari groups workspace ini
//         const workspaceTasks = allTasks.filter((t) =>
//           workspaceGroupIds.some(
//             (gid) => gid.toString() === t.groups.toString()
//           )
//         );

//         const totalTask = workspaceTasks.length;
//         const completedTask = workspaceTasks.filter(
//           (t) => t.status === "Done"
//         ).length;

//         // Hitung progress projects dalam workspace
//         const projectsProgress = workspaceProjects.map((project) => {
//           const projectGroupIds = workspaceGroups
//             .filter((g) => g.project.toString() === project._id.toString())
//             .map((g) => g._id);

//           const projectTasks = workspaceTasks.filter((t) =>
//             projectGroupIds.some(
//               (gid) => gid.toString() === t.groups.toString()
//             )
//           );

//           const totalProjectTask = projectTasks.length;
//           const completedProjectTask = projectTasks.filter(
//             (t) => t.status === "Done"
//           ).length;

//           const projectProgress =
//             totalProjectTask === 0
//               ? 0
//               : Math.round((completedProjectTask / totalProjectTask) * 100);

//           return {
//             projectId: project._id,
//             projectName: project.nama,
//             progress: projectProgress,
//             totalTask: totalProjectTask,
//             completedTask: completedProjectTask,
//           };
//         });

//         // Progress workspace = rata-rata progress semua projects
//         const totalProjectProgress = projectsProgress.reduce(
//           (sum, p) => sum + p.progress,
//           0
//         );
//         const workspaceProgress =
//           workspaceProjects.length === 0
//             ? 0
//             : Math.round(totalProjectProgress / workspaceProjects.length);

//         return {
//           workspaceId: workspace._id,
//           workspaceName: workspace.nama,
//           totalProject: workspaceProjects.length,
//           // totalTask,
//           // completedTask,
//           progress: workspaceProgress,
//           projects: projectsProgress,
//         };
//       })
//     );

//     // 5. Hitung progress kuarter dengan SIMPLE AVERAGE
//     // Jumlahkan semua progress workspace, lalu bagi dengan jumlah workspace
//     const totalWorkspaceProgress = workspacesProgress.reduce(
//       (sum, ws) => sum + ws.progress,
//       0
//     );

//     const kuarterProgress =
//       totalWorkspace === 0
//         ? 0
//         : Math.round(totalWorkspaceProgress / totalWorkspace);

//     // 6. Statistik tambahan
//     const totalProjects = workspacesProgress.reduce(
//       (sum, ws) => sum + ws.totalProject,
//       0
//     );
//     // const totalTasks = workspacesProgress.reduce(
//     //   (sum, ws) => sum + ws.totalTask,
//     //   0
//     // );
//     // const totalCompletedTasks = workspacesProgress.reduce(
//     //   (sum, ws) => sum + ws.completedTask,
//     //   0
//     // );

//     res.json({
//       success: true,
//       data: {
//         kuarterId: kuarter._id,
//         kuarterName: kuarter.nama,
//         departemen: kuarter.departemen,
//         totalWorkspace,
//         totalProject: totalProjects,
//         // totalTask: totalTasks,
//         // completedTask: totalCompletedTasks,
//         progress: kuarterProgress,
//         workspaces: workspacesProgress,
//       },
//     });
//   } catch (error) {
//     return handleError(res, error);
//   }
// }

// export async function getProgresByKuarter(req, res) {
//   try {
//     const { kuarterId } = req.params;

//     const kuarter = await Kuarter.findById(kuarterId);
//     if (!kuarter) {
//       return res.status(404).json({
//         success: false,
//         message: "Kuarter tidak ditemukan",
//       });
//     }

//     const workspaces = await Workspace.find({ kuarter: kuarterId });
//     const totalWorkspace = workspaces.length;

//     if (totalWorkspace === 0) {
//       return res.json({
//         success: true,
//         data: {
//           kuarterId: kuarter._id,
//           kuarterName: kuarter.nama,
//           departemen: kuarter.departemen,
//           totalWorkspace: 0,
//           totalProject: 0,
//           completedProject: 0,
//           inProgressProject: 0,
//           planningProject: 0,
//           undatedProject: 0,
//           notStartedProject: 0,
//           undatedTask: 0,
//           progress: 0,
//           workspaces: [],
//         },
//       });
//     }

//     const workspaceIds = workspaces.map((w) => w._id);

//     const allProjects = await Project.find({
//       $or: [
//         { workspace: { $in: workspaceIds } },
//         { otherWorkspaces: { $in: workspaceIds } },
//       ],
//     });

//     const projectIds = allProjects.map((p) => p._id);
//     const allGroups = await Group.find({ project: { $in: projectIds } });

//     const allGroupIds = allGroups.map((g) => g._id);
//     const allTasks = await Task.find({ groups: { $in: allGroupIds } });

//     // ============================================================
//     // HITUNG STATUS PROJECT (SAMA LOGIKA DENGAN getProgresByWorkspace)
//     // ============================================================
//     const projectsStatus = allProjects.map((project) => {
//       const projectGroupIds = allGroups
//         .filter((g) => g.project.toString() === project._id.toString())
//         .map((g) => g._id);

//       const projectTasks = allTasks.filter((t) =>
//         projectGroupIds.some((gid) => gid.toString() === t.groups.toString())
//       );

//       const totalTask = projectTasks.length;
//       const completedTask = projectTasks.filter(
//         (t) => t.status === "Done"
//       ).length;

//       const percent =
//         totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

//       const allPlanning =
//         totalTask > 0 &&
//         projectTasks.every(
//           (t) => t.status === "To Do" && t.note === "Planning"
//         );

//       const allUndated =
//         totalTask > 0 &&
//         projectTasks.every(
//           (t) =>
//             (t.status === "Hold" || t.status === "Blocked") &&
//             t.note === "Planning"
//         );

//       const undatedTask = projectTasks.filter(
//         (t) => !t.due_date || t.due_date === null
//       ).length;

//       return {
//         projectId: project._id,
//         projectName: project.nama,
//         progress: percent,
//         totalTask,
//         completedTask,
//         undatedTask,
//         isCompleted: percent === 100,
//         isPlanning: allPlanning,
//         isUndated: allUndated,
//         isInProgress:
//           percent > 0 && percent < 100 && !allPlanning && !allUndated,
//         isNotStarted: percent === 0 && !allPlanning && !allUndated,
//       };
//     });

//     // ============================================================
//     // SUMMARY PROJECT PER KUARTER
//     // ============================================================
//     const completedProject = projectsStatus.filter((p) => p.isCompleted).length;
//     const planningProject = projectsStatus.filter((p) => p.isPlanning).length;
//     const undatedProject = projectsStatus.filter((p) => p.isUndated).length;
//     const inProgressProject = projectsStatus.filter(
//       (p) => p.isInProgress
//     ).length;
//     const notStartedProject = projectsStatus.filter(
//       (p) => p.isNotStarted
//     ).length;
//     const totalUndatedTask = projectsStatus.reduce(
//       (sum, p) => sum + p.undatedTask,
//       0
//     );

//     // ============================================================
//     // Hitung progres tiap workspace (simple average)
//     // ============================================================
//     const workspacesProgress = await Promise.all(
//       workspaces.map(async (workspace) => {
//         const workspaceProjects = allProjects.filter(
//           (p) =>
//             p.workspace.toString() === workspace._id.toString() ||
//             (p.otherWorkspaces &&
//               p.otherWorkspaces.some(
//                 (ow) => ow.toString() === workspace._id.toString()
//               ))
//         );

//         const projectProgressList = workspaceProjects.map((project) => {
//           const projState = projectsStatus.find(
//             (ps) => ps.projectId.toString() === project._id.toString()
//           );
//           return projState ? projState.progress : 0;
//         });

//         const workspaceProgress =
//           projectProgressList.length === 0
//             ? 0
//             : Math.round(
//                 projectProgressList.reduce((a, b) => a + b, 0) /
//                   projectProgressList.length
//               );

//         return {
//           workspaceId: workspace._id,
//           workspaceName: workspace.nama,
//           totalProject: workspaceProjects.length,
//           progress: workspaceProgress,
//         };
//       })
//     );

//     // ============================================================
//     // Hitung progress kuarter (AVERAGE)
//     // ============================================================
//     const totalWorkspaceProgress = workspacesProgress.reduce(
//       (sum, ws) => sum + ws.progress,
//       0
//     );

//     const kuarterProgress =
//       totalWorkspace === 0
//         ? 0
//         : Math.round(totalWorkspaceProgress / totalWorkspace);

//     // ============================================================
//     // RESPONSE
//     // ============================================================
//     res.json({
//       success: true,
//       data: {
//         kuarterId: kuarter._id,
//         kuarterName: kuarter.nama,
//         departemen: kuarter.departemen,
//         totalWorkspace,
//         totalProject: allProjects.length,

//         // summary baru
//         completedProject,
//         inProgressProject,
//         planningProject,
//         undatedProject,
//         notStartedProject,
//         undatedTask: totalUndatedTask,

//         progress: kuarterProgress,
//         workspaces: workspacesProgress,
//       },
//     });
//   } catch (error) {
//     return handleError(res, error);
//   }
// }

export async function getProgresByKuarter(req, res) {
  try {
    const { kuarterId } = req.params;

    const kuarter = await Kuarter.findById(kuarterId);
    if (!kuarter) {
      return res.status(404).json({
        success: false,
        message: "Kuarter tidak ditemukan",
      });
    }

    const workspaces = await Workspace.find({ kuarter: kuarterId });
    const totalWorkspace = workspaces.length;

    // Jika kosong, return 0 semua
    if (totalWorkspace === 0) {
      return res.json({
        success: true,
        data: {
          kuarterId: kuarter._id,
          kuarterName: kuarter.nama,
          departemen: kuarter.departemen,
          totalWorkspace: 0,
          totalProject: 0,
          completedProject: 0,
          inProgressProject: 0,
          planningProject: 0,
          undatedProject: 0,
          notStartedProject: 0,
          overdueProject: 0,
          undatedTask: 0,
          progress: 0,
          workspaces: [],
        },
      });
    }

    const workspaceIds = workspaces.map((w) => w._id);

    // Ambil seluruh project di kuarter ini
    const allProjects = await Project.find({
      $or: [
        { workspace: { $in: workspaceIds } },
        { otherWorkspaces: { $in: workspaceIds } },
      ],
    });

    const projectIds = allProjects.map((p) => p._id);

    const allGroups = await Group.find({ project: { $in: projectIds } });
    const allGroupIds = allGroups.map((g) => g._id);

    const allTasks = await Task.find({ groups: { $in: allGroupIds } });

    // ============================================================
    // HITUNG STATUS PROJECT (SESUAI getProgresByWorkspace)
    // TERMASUK overdueProject (Completed - Overdue)
    // ============================================================
    const projectsStatus = allProjects.map((project) => {
      const projectGroupIds = allGroups
        .filter((g) => g.project.toString() === project._id.toString())
        .map((g) => g._id);

      const projectTasks = allTasks.filter((t) =>
        projectGroupIds.some((gid) => gid.toString() === t.groups.toString())
      );

      const totalTask = projectTasks.length;
      const completedTask = projectTasks.filter(
        (t) => t.status === "Done"
      ).length;

      const percent =
        totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

      const allPlanning =
        totalTask > 0 &&
        projectTasks.every(
          (t) => t.status === "To Do" && t.note === "Planning"
        );

      const allUndated =
        totalTask > 0 &&
        projectTasks.every(
          (t) =>
            (t.status === "Hold" || t.status === "Blocked") &&
            t.note === "Planning"
        );

      const undatedTask = projectTasks.filter(
        (t) => !t.due_date || t.due_date === null
      ).length;

      // ============= ADD: CHECK PROJECT TERLAMBAT =============
      const isOverdue = projectTasks.some(
        (t) => t.status === "Done" && t.note === "Completed - Overdue"
      );

      return {
        projectId: project._id,
        projectName: project.nama,

        progress: percent,
        totalTask,
        completedTask,
        undatedTask,

        isCompleted: percent === 100,
        isPlanning: allPlanning,
        isUndated: allUndated,
        isInProgress:
          percent > 0 && percent < 100 && !allPlanning && !allUndated,
        isNotStarted: percent === 0 && !allPlanning && !allUndated,

        // ADD:
        isOverdue,
      };
    });

    // ============================================================
    // SUMMARY PROJECT KUARTER
    // ============================================================
    const completedProject = projectsStatus.filter((p) => p.isCompleted).length;
    const planningProject = projectsStatus.filter((p) => p.isPlanning).length;
    const undatedProject = projectsStatus.filter((p) => p.isUndated).length;
    const inProgressProject = projectsStatus.filter(
      (p) => p.isInProgress
    ).length;
    const notStartedProject = projectsStatus.filter(
      (p) => p.isNotStarted
    ).length;

    // ADD: total project terlambat
    const overdueProject = projectsStatus.filter((p) => p.isOverdue).length;

    const totalUndatedTask = projectsStatus.reduce(
      (sum, p) => sum + p.undatedTask,
      0
    );

    // ============================================================
    // HITUNG PROGRES PER WORKSPACE
    // ============================================================
    const workspacesProgress = await Promise.all(
      workspaces.map(async (workspace) => {
        const workspaceProjects = allProjects.filter(
          (p) =>
            p.workspace.toString() === workspace._id.toString() ||
            (p.otherWorkspaces &&
              p.otherWorkspaces.some(
                (ow) => ow.toString() === workspace._id.toString()
              ))
        );

        const projectProgressList = workspaceProjects.map((project) => {
          const projState = projectsStatus.find(
            (ps) => ps.projectId.toString() === project._id.toString()
          );
          return projState ? projState.progress : 0;
        });

        const workspaceProgress =
          projectProgressList.length === 0
            ? 0
            : Math.round(
                projectProgressList.reduce((a, b) => a + b, 0) /
                  projectProgressList.length
              );

        return {
          workspaceId: workspace._id,
          workspaceName: workspace.nama,
          totalProject: workspaceProjects.length,
          progress: workspaceProgress,
        };
      })
    );

    // ============================================================
    // FINAL: PROGRESS KUARTER
    // ============================================================
    const totalWorkspaceProgress = workspacesProgress.reduce(
      (sum, ws) => sum + ws.progress,
      0
    );

    const kuarterProgress =
      totalWorkspace === 0
        ? 0
        : Math.round(totalWorkspaceProgress / totalWorkspace);

    // ============================================================
    // RESPONSE
    // ============================================================
    res.json({
      success: true,
      data: {
        kuarterId: kuarter._id,
        kuarterName: kuarter.nama,
        departemen: kuarter.departemen,

        totalWorkspace,
        totalProject: allProjects.length,

        completedProject,
        inProgressProject,
        planningProject,
        undatedProject,
        notStartedProject,
        overdueProject, // ✔ Tambahan
        undatedTask: totalUndatedTask,

        progress: kuarterProgress,
        workspaces: workspacesProgress,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}
