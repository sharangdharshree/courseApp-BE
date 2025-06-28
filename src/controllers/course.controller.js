// will deal with access of course with its full contents, only authorized user can be able to access
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Course, Section, Content } from "../models/course.model.js";

// for authorized users / admin

const getCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.body.courseId;
    const user = req?.user;
    const admin = req?.admin;

    if (!user && !admin) {
      throw new ApiError(401, "Access denied for the course");
    }

    const course = await Course.findById(courseId);

    if (user) {
      if (
        !user.purchases.includes(
          await Purchase.findOne({ owner: user, course: course })
        )
      ) {
        throw new ApiError(401, "Access denied for the course");
      }
    }
    if (admin) {
      if (!admin.courses.includes(await Course.findById(courseId))) {
        throw new ApiError(401, "Access denied for the course");
      }
    }

    // fetch all sections and its contents
    const sections = [];
    for (let i = 0; i < course.sections.length; i++) {
      const contents = [];
      const tempSection = await Section.findById(course.sections[i]);
      for (let j = 0; j < tempSection.contents.length; j++) {
        const tempContent = await Content.findById(tempSection.contents[j]);
        contents.push(tempContent);
      }
      tempSection.contents = contents;
      sections.push(tempSection);
    }
    const responseCourse = course.select("-basePrice -isPublished");
    responseCourse.sections = sections;

    // send full course
    return res
      .status(201)
      .json(
        new ApiResponse(201, { responseCourse }, "Course fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

// for authorized admins

const addSection = asyncHandler(async (req, res) => {
  try {
    // fetch and check course
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(400, "Course not found");
    }

    // check if admin is authorized for this course
    const admin = req.admin;
    if (course.createdBy !== admin) {
      throw new ApiError(401, "Admin not authorized for this course");
    }

    // take validated section data
    const [title, description] = req.body;

    // create section
    const section = await Section.create({
      title: title,
      description: description,
    });

    // add section to course and create response
    course.sections.push(section);
    const updatedCourse = await course.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { updatedCourse }, "Section added successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong, section not added"
    );
  }
});

const updateSection = asyncHandler(async (req, res) => {
  try {
    // fetch and check section
    const sectionId = req.body.sectionId;
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError(400, "Section not found");
    }

    // check if admin is authorized for this course
    const admin = req.admin;
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    if (course.createdBy !== admin || !course.sections.includes(section)) {
      throw new ApiError(401, "Admin not authorized for this course");
    }

    // take validated data and update section
    const [title, description] = req.body;
    section.title = title;
    section.description = description;
    const updatedSection = await section.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { updatedSection }, "Section updated successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while updating section"
    );
  }
});
const deleteSection = asyncHandler(async (req, res) => {
  try {
    // fetch and check section
    const sectionId = req.body.sectionId;
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError(400, "Section not found");
    }

    // check if admin is authorized for this course
    const admin = req.admin;
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    if (course.createdBy !== admin || !course.sections.includes(section)) {
      throw new ApiError(401, "Admin not authorized for this course");
    }

    // delete all contents of the section form schema and from cloudinary
    for (let i = 0; i < section.contents.length; i++) {
      const content = await Content.findById(section.contents[i]);
      // deletion from cloudinary
      await deleteFromCloudinary(content.publicId);
      //deletion from schema
      await content.remove();
    }

    // remove reference from the course
    const sectionIndex = course.sections.findIndex(
      (sectionEle) => sectionEle == section
    );
    course.sections.splice(sectionIndex, 1);
    await course.save();

    // delete section from section schema
    const deletedSection = await Section.findByIdAndDelete(section._id);

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { deletedSection }, "Section deleted successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while deleting section"
    );
  }
});
const addContent = asyncHandler(async (req, res) => {
  try {
    // fetch and check section
    const sectionId = req.body.sectionId;
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError(400, "Section not found");
    }

    // check if admin is authorized for this course
    const admin = req.admin;
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    if (course.createdBy !== admin || !course.sections.includes(section)) {
      throw new ApiError(401, "Admin not authorized for this course");
    }

    // take local path of the content and upload to cloudinary
    const contentLocalPath = req.file?.path;
    const content = await uploadOnCloudinary(contentLocalPath);

    // take validated title data
    const title = req.body.title;

    // create content document
    const createdContent = await Content.create({
      type: `${content.resource_type},${content.format}`,
      title: title,
      publicId: content.public_id,
      url: content.url,
      duration: content.duration,
      size: content.bytes,
      uploadTime: content.created_at,
    });

    // generate thumbnail url and save
    createdContent.thumbnail = createdContent.generateThumbnailUrl(
      content.public_id
    );
    const finalCreatedContent = await createdContent.save();

    // add content in section
    section.contents.push(createdContent);
    await section.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { finalCreatedContent },
          "Content uploaded successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});
const updateContent = asyncHandler(async (req, res) => {
  try {
    // fetch and check content
    const contentId = req.body.contentId;
    const content = await Content.findById(contentId);
    if (!content) {
      throw new ApiError(401, "Content not found");
    }

    // fetch and check section
    const sectionId = req.body.sectionId;
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError(400, "Section not found");
    }

    // check if admin is authorized for this course
    const admin = req.admin;
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    if (
      course.createdBy !== admin ||
      !course.sections.includes(section) ||
      !section.contents.includes(content)
    ) {
      throw new ApiError(401, "Admin not authorized for this course");
    }

    // take validated title data
    const title = req.body.title;

    // take local path of the content and upload to cloudinary
    const contentLocalPath = req.file?.path;
    const uploadedContent = await uploadOnCloudinary(contentLocalPath);

    // remove old content from cloudinary
    await deleteFromCloudinary(content.publicId);

    // make update in content document
    content.type = `${uploadedContent.resource_type},${uploadedContent.format}`;
    content.title = title;
    content.publicId = uploadedContent.public_id;
    content.url = uploadedContent.url;
    content.duration = uploadedContent.duration;
    content.size = uploadedContent.size;
    content.thumbnail = content.generateThumbnailUrl(uploadedContent.public_id);
    content.uploadTime = uploadedContent.created_at;
    const updatedContent = await content.save();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { updatedContent }, "Content updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});
const deleteContent = asyncHandler(async (req, res) => {
  try {
    // fetch and check content
    const contentId = req.body.contentId;
    const content = await Content.findById(contentId);
    if (!content) {
      throw new ApiError(401, "Content not found");
    }

    // fetch and check section
    const sectionId = req.body.sectionId;
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError(400, "Section not found");
    }

    // check if admin is authorized for this course
    const admin = req.admin;
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    if (
      course.createdBy !== admin ||
      !course.sections.includes(section) ||
      !section.contents.includes(content)
    ) {
      throw new ApiError(401, "Admin not authorized for this course");
    }

    // remove content from cloudinary
    await deleteFromCloudinary(content.publicId);
    // remove content document
    const deletedContent = await content.remove();

    // send response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { deleteContent }, "Content deleted successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export {
  getCourse,
  addSection,
  updateSection,
  deleteSection,
  addContent,
  updateContent,
  deleteContent,
};
