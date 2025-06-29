
LIVE LINK: https://courseapp-be-bq2o.onrender.com/

Readme Re-struction in process...
  1. project setup: DONE
   dependencies installed, devDependencies created,
   entry/start script written, type set to module,
   asyncHandler, ApiResponse, ApiError, errorMiddleware created for structure handling of async controller logics and then structure error handling and error response sending 
   env created, constant file created, values set in those files 

   2. db connection logic done in db file, connection function executed in the entry file index.js, app listening set to port

   3. define schema and models : DONE

   4. define controllers, with middleware and validators 
      : user related controller, validators, middleware DONE
      : public controller: DONE
      : admin controllers: DONE
      : then course controller: DONE
   5. define routes 
      : user routes defined: DONE
      : public route: DONE 
      : admin route: DONE
      : then course route: DONE

      // course routing could be improve instead of course/:id/create or update section or content and sending the respective section id and content id in body, 
      // we can create routes like following: course/:courseId/:sectionId/operations like create, update, delete
      // and /:courseId/:sectionId/:contentId/operations

   6. testing 
      // user tested for most of the routes, purchase and fet purchased courses functionality yet to test
      // now will test admin end point, then will create, update, delete courses
      // add,update, delete section and contents
      // finally test purchase functionalities

      

   7. backend deploy: seeing Render platform ....

   7. frontend work starts 



// defined user routes and controller, zod schema validation for user controllers, set global middlewares in app


// csrf protection
security : Helmet, Rate limiting
