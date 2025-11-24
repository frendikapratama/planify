import Group from "../models/Group.js";
import Project from "../models/Project.js";
import { handleError } from "../utils/errorHandler.js";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";

export async function getGanttChartByKuarter(req, res) {
  try {
    const { kuarterId } = req.params;

    if (!kuarterId) {
      return res.status(400).json({
        success: false,
        message: "Kuarter tidak ditemukan",
      });
    }

    // Ambil semua workspace yang terkait dengan kuarter ini
    const workspaces = await Workspace.find({ kuarter: kuarterId });

    if (workspaces.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const workspaceIds = workspaces.map((w) => w._id);

    // Ambil semua project dalam workspaces tersebut
    const projects = await Project.find({
      $or: [
        { workspace: { $in: workspaceIds } },
        { otherWorkspaces: { $in: workspaceIds } },
      ],
    });

    if (projects.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const projectIds = projects.map((p) => p._id);
    const groups = await Group.find({ project: { $in: projectIds } });

    // Buat data gantt chart untuk setiap project
    const projectData = await Promise.all(
      projects.map(async (project) => {
        // Cari workspace yang terkait dengan project ini
        const relatedWorkspace = workspaces.find(
          (w) =>
            w._id.toString() === project.workspace?.toString() ||
            project.otherWorkspaces?.some(
              (ow) => ow.toString() === w._id.toString()
            )
        );

        // Ambil grup yang terkait dengan project ini
        const projectGroupIds = groups
          .filter((g) => g.project.toString() === project._id.toString())
          .map((g) => g._id);

        // Ambil semua task dalam project ini
        const projectTasks = await Task.find({
          groups: { $in: projectGroupIds },
        });

        // Jika tidak ada task, skip project ini
        if (projectTasks.length === 0) {
          return null;
        }

        // Filter task yang memiliki start_date
        const tasksWithStartDate = projectTasks.filter((t) => t.start_date);

        // Filter task yang memiliki due_date
        const tasksWithDueDate = projectTasks.filter((t) => t.due_date);

        // Ambil start_date paling awal (pertama)
        const startDate =
          tasksWithStartDate.length > 0
            ? new Date(
                Math.min(
                  ...tasksWithStartDate.map((t) => new Date(t.start_date))
                )
              )
            : null;

        // Ambil due_date paling akhir (terlama)
        const dueDate =
          tasksWithDueDate.length > 0
            ? new Date(
                Math.max(...tasksWithDueDate.map((t) => new Date(t.due_date)))
              )
            : null;

        return {
          workspaceId: relatedWorkspace?._id,
          workspaceName: relatedWorkspace?.nama || "Unknown Workspace",
          projectName: project.nama,
          start_date: startDate,
          due_date: dueDate,
        };
      })
    );

    // Filter out projects dengan null (tidak ada task)
    const filteredProjectData = projectData.filter((item) => item !== null);

    // Group projects by workspace
    const groupedByWorkspace = filteredProjectData.reduce((acc, project) => {
      const workspaceId = project.workspaceId?.toString();

      if (!acc[workspaceId]) {
        acc[workspaceId] = {
          workspaceName: project.workspaceName,
          projects: [],
        };
      }

      acc[workspaceId].projects.push({
        projectName: project.projectName,
        start_date: project.start_date,
        due_date: project.due_date,
      });

      return acc;
    }, {});

    // Convert grouped data to array
    const ganttData = Object.values(groupedByWorkspace);

    res.json({
      success: true,
      data: ganttData,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getGanttChartByWorkspace(req, res) {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace tidak ditemukan",
      });
    }

    // Ambil semua project dalam workspace
    const projects = await Project.find({
      $or: [{ workspace: workspaceId }, { otherWorkspaces: workspaceId }],
    });

    if (projects.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const projectIds = projects.map((p) => p._id);
    const groups = await Group.find({ project: { $in: projectIds } });

    const ganttData = await Promise.all(
      projects.map(async (project) => {
        const projectGroupIds = groups
          .filter((g) => g.project.toString() === project._id.toString())
          .map((g) => g._id);

        const projectTasks = await Task.find({
          groups: { $in: projectGroupIds },
        });

        if (projectTasks.length === 0) {
          return null;
        }

        const tasksWithStartDate = projectTasks.filter((t) => t.start_date);

        const tasksWithDueDate = projectTasks.filter((t) => t.due_date);

        const tasksWithFinishDate = projectTasks.filter((t) => t.finish_date);

        const startDate =
          tasksWithStartDate.length > 0
            ? new Date(
                Math.min(
                  ...tasksWithStartDate.map((t) => new Date(t.start_date))
                )
              )
            : null;

        const dueDate =
          tasksWithDueDate.length > 0
            ? new Date(
                Math.max(...tasksWithDueDate.map((t) => new Date(t.due_date)))
              )
            : null;

        const finishDate =
          tasksWithFinishDate.length > 0
            ? new Date(
                Math.max(
                  ...tasksWithFinishDate.map((t) => new Date(t.finish_date))
                )
              )
            : null;

        const totalTask = projectTasks.length;
        const completedTask = projectTasks.filter(
          (t) => t.status === "Done"
        ).length;
        const progress =
          totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

        return {
          projectId: project._id,
          name: project.nama,
          start_date: startDate,
          due_date: dueDate,
          finish_date: finishDate,
          progress: progress,
          totalTask: totalTask,
          completedTask: completedTask,
        };
      })
    );

    const filteredGanttData = ganttData.filter((item) => item !== null);

    res.json({
      success: true,
      data: filteredGanttData,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getGanttChartByProject(req, res) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project tidak ditemukan",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project tidak ditemukan",
      });
    }

    const groups = await Group.find({ project: projectId });

    if (groups.length === 0) {
      return res.json({
        success: true,
        data: {
          project: {
            id: project._id,
            name: project.nama,
            description: project.description,
          },
          groups: [],
        },
      });
    }

    const ganttData = await Promise.all(
      groups.map(async (group) => {
        const groupTasks = await Task.find({ groups: group._id });

        if (groupTasks.length === 0) {
          return {
            groupId: group._id,
            nama: group.nama,
            start_date: null,
            due_date: null,
            finish_date: null,
            progress: 0,
            totalTask: 0,
            completedTask: 0,
            tasks: [],
          };
        }

        const tasksWithStartDate = groupTasks.filter((t) => t.start_date);

        const tasksWithDueDate = groupTasks.filter((t) => t.due_date);

        const tasksWithFinishDate = groupTasks.filter((t) => t.finish_date);

        // Ambil start_date paling awal
        const startDate =
          tasksWithStartDate.length > 0
            ? new Date(
                Math.min(
                  ...tasksWithStartDate.map((t) => new Date(t.start_date))
                )
              )
            : null;

        // Ambil due_date paling akhir
        const dueDate =
          tasksWithDueDate.length > 0
            ? new Date(
                Math.max(...tasksWithDueDate.map((t) => new Date(t.due_date)))
              )
            : null;

        // Ambil finish_date paling akhir
        const finishDate =
          tasksWithFinishDate.length > 0
            ? new Date(
                Math.max(
                  ...tasksWithFinishDate.map((t) => new Date(t.finish_date))
                )
              )
            : null;

        // Hitung progress
        const totalTask = groupTasks.length;
        const completedTask = groupTasks.filter(
          (t) => t.status === "Done"
        ).length;
        const progress =
          totalTask === 0 ? 0 : Math.round((completedTask / totalTask) * 100);

        // Map tasks individual (opsional, untuk detail)
        const tasksDetail = groupTasks.map((task) => ({
          taskId: task._id,
          nama: task.nama,
          start_date: task.start_date,
          due_date: task.due_date,
          finish_date: task.finish_date,
          status: task.status,
          assignee: task.assignee,
        }));

        return {
          groupId: group._id,
          nama: group.nama,
          start_date: startDate,
          due_date: dueDate,
          finish_date: finishDate,
          progress: progress,
          totalTask: totalTask,
          completedTask: completedTask,
          tasks: tasksDetail,
        };
      })
    );

    res.json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.nama,
          description: project.description,
        },
        groups: ganttData,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}
