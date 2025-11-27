import Group from "../models/Group.js";
import Project from "../models/Project.js";
import { handleError } from "../utils/errorHandler.js";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import Kuarter from "../models/Kuarter.js"; // Pastikan model Kuarter diimport

export async function getTasksWithMeetingDateByKuarter(req, res) {
  try {
    const { kuarterId } = req.params;

    if (!kuarterId) {
      return res.status(400).json({
        success: false,
        message: "Kuarter ID tidak ditemukan",
      });
    }

    // Verifikasi kuarter exists
    const kuarter = await Kuarter.findById(kuarterId);
    if (!kuarter) {
      return res.status(404).json({
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
        message: "Tidak ada workspace yang ditemukan untuk kuarter ini",
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
        message: "Tidak ada project yang ditemukan",
      });
    }

    const projectIds = projects.map((p) => p._id);

    // Ambil semua group yang terkait dengan projects
    const groups = await Group.find({ project: { $in: projectIds } });

    if (groups.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "Tidak ada group yang ditemukan",
      });
    }

    const groupIds = groups.map((g) => g._id);

    // Ambil semua task yang memiliki meeting_date dan terkait dengan groups
    const tasks = await Task.find({
      groups: { $in: groupIds },
      meeting_date: { $exists: true, $ne: null },
    })
      .populate("groups")

      .sort({ meeting_date: 1 });

    if (tasks.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "Tidak ada task dengan meeting date yang ditemukan",
      });
    }

    // Format response data dengan informasi lengkap
    const formattedTasks = tasks.map((task) => {
      // Cari groups yang terkait dengan task ini
      const taskGroups = groups.filter((g) =>
        task.groups.some((tg) => tg._id.toString() === g._id.toString())
      );

      // Cari projects yang terkait dengan groups ini
      const taskProjects = projects.filter((p) =>
        taskGroups.some((tg) => tg.project.toString() === p._id.toString())
      );

      // Cari workspace yang terkait dengan projects ini
      const taskWorkspaces = workspaces.filter((w) =>
        taskProjects.some(
          (p) =>
            p.workspace?.toString() === w._id.toString() ||
            p.otherWorkspaces?.some((ow) => ow.toString() === w._id.toString())
        )
      );

      // Ambil workspace utama (prioritaskan workspace langsung)
      const mainWorkspace =
        taskWorkspaces.find((w) =>
          taskProjects.some((p) => p.workspace?.toString() === w._id.toString())
        ) || taskWorkspaces[0];

      return {
        // Task Information
        task: {
          id: task._id,
          nama: task.nama,
          deskripsi: task.deskripsi,
          meeting_date: task.meeting_date,
          start_date: task.start_date,
          due_date: task.due_date,
          status: task.status,
          priority: task.priority,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
        },

        // Group Information
        groups: taskGroups.map((group) => ({
          id: group._id,
          nama: group.nama,
          deskripsi: group.deskripsi,
        })),

        // Project Information
        projects: taskProjects.map((project) => ({
          id: project._id,
          nama: project.nama,
          deskripsi: project.deskripsi,
          start_date: project.start_date,
          due_date: project.due_date,
        })),

        // Workspace Information
        workspace: mainWorkspace
          ? {
              id: mainWorkspace._id,
              nama: mainWorkspace.nama,
              deskripsi: mainWorkspace.deskripsi,
            }
          : null,

        // Kuarter Information
        kuarter: {
          id: kuarter._id,
          nama: kuarter.nama,
          tahun: kuarter.tahun,
          start_date: kuarter.start_date,
          end_date: kuarter.end_date,
        },
      };
    });

    // Group by meeting_date (opsional)
    const groupedByMeetingDate = formattedTasks.reduce((acc, task) => {
      const meetingDate = task.task.meeting_date.toISOString().split("T")[0];

      if (!acc[meetingDate]) {
        acc[meetingDate] = [];
      }

      acc[meetingDate].push(task);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        tasks: formattedTasks,
        // grouped_by_meeting_date: groupedByMeetingDate,
        summary: {
          total_tasks: formattedTasks.length,
          total_meeting_dates: Object.keys(groupedByMeetingDate).length,
          total_projects: [
            ...new Set(
              formattedTasks.flatMap((t) => t.projects.map((p) => p.id))
            ),
          ].length,
          total_groups: [
            ...new Set(
              formattedTasks.flatMap((t) => t.groups.map((g) => g.id))
            ),
          ].length,
          total_workspaces: [
            ...new Set(
              formattedTasks.map((t) => t.workspace?.id).filter(Boolean)
            ),
          ].length,
        },
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// Fungsi alternatif: Get tasks dengan meeting_date dalam rentang tanggal kuarter
export async function getTasksWithMeetingDateInKuarterRange(req, res) {
  try {
    const { kuarterId } = req.params;

    if (!kuarterId) {
      return res.status(400).json({
        success: false,
        message: "Kuarter ID tidak ditemukan",
      });
    }

    // Dapatkan informasi kuarter termasuk rentang tanggal
    const kuarter = await Kuarter.findById(kuarterId);
    if (!kuarter) {
      return res.status(404).json({
        success: false,
        message: "Kuarter tidak ditemukan",
      });
    }

    // Ambil semua workspace yang terkait dengan kuarter ini
    const workspaces = await Workspace.find({ kuarter: kuarterId });
    const workspaceIds = workspaces.map((w) => w._id);

    // Ambil semua project dalam workspaces tersebut
    const projects = await Project.find({
      $or: [
        { workspace: { $in: workspaceIds } },
        { otherWorkspaces: { $in: workspaceIds } },
      ],
    });

    const projectIds = projects.map((p) => p._id);
    const groups = await Group.find({ project: { $in: projectIds } });
    const groupIds = groups.map((g) => g._id);

    // Ambil task yang memiliki meeting_date dalam rentang kuarter
    const tasks = await Task.find({
      groups: { $in: groupIds },
      meeting_date: {
        $exists: true,
        $ne: null,
        $gte: kuarter.start_date,
        $lte: kuarter.end_date,
      },
    })
      .populate("groups")

      .sort({ meeting_date: 1 });

    // Format response (sama seperti fungsi sebelumnya)
    const formattedTasks = tasks.map((task) => {
      const taskGroups = groups.filter((g) =>
        task.groups.some((tg) => tg._id.toString() === g._id.toString())
      );

      const taskProjects = projects.filter((p) =>
        taskGroups.some((tg) => tg.project.toString() === p._id.toString())
      );

      const taskWorkspaces = workspaces.filter((w) =>
        taskProjects.some(
          (p) =>
            p.workspace?.toString() === w._id.toString() ||
            p.otherWorkspaces?.some((ow) => ow.toString() === w._id.toString())
        )
      );

      const mainWorkspace =
        taskWorkspaces.find((w) =>
          taskProjects.some((p) => p.workspace?.toString() === w._id.toString())
        ) || taskWorkspaces[0];

      return {
        task: {
          id: task._id,
          nama: task.nama,
          meeting_date: task.meeting_date,
          status: task.status,
        },
        groups: taskGroups.map((group) => ({
          id: group._id,
          nama: group.nama,
        })),
        projects: taskProjects.map((project) => ({
          id: project._id,
          nama: project.nama,
        })),
        workspace: mainWorkspace
          ? {
              id: mainWorkspace._id,
              nama: mainWorkspace.nama,
            }
          : null,
        kuarter: {
          id: kuarter._id,
          nama: kuarter.nama,
        },
      };
    });

    res.json({
      success: true,
      data: formattedTasks,
      total: formattedTasks.length,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
