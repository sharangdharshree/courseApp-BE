  
  1. project setup: DONE
   dependencies installed, devDependencies created,
   entry/start script written, type set to module,
   asyncHandler, ApiResponse, ApiError, errorMiddleware created for structure handling of async controller logics and then structure error handling and error response sending 
   env created, constant file created, values set in those files 

   2. db connection logic done in db file, connection function executed in the entry file index.js, app listening set to port

   3. define schema and models 

   4. define controllers, with middleware and validators 

   5. define routes 

   6. testing 

   7. backend deploy 

   7. frontend work starts 



schema: 
user, admin, course, purchase 

user{
    fullName,
    email,
    phone,
    purchase:[ref purchase  ]
}
admin{
    type: user
    ref: 
    courses:[ref course]
}
course{
    title: 
    overview:
    description:
    price:
    contents:[]

}
purchase{
    owner:
    datetime:
    amount paid:
    invoice:
    course: ref course //could enroll only single course in one transaction, no concept of cart
}

// csrf protection
security : Helmet, Rate limiting