  
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
      : admin controllers, then course controller...
   5. define routes 
      : user routes defined: DONE
      : public route: DONE 
      : admin route, then course route...
   6. testing 

   7. backend deploy 

   7. frontend work starts 



// defined user routes and controller, zod schema validation for user controllers, set global middlewares in app


// csrf protection
security : Helmet, Rate limiting