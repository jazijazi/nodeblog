# NodeBlog

### A simple API with nodejs mongodb redis *(on docker)* use jwt for authentication

## Commands
- install npm packages `npm install`
- run docker containers `docker-compose -f services.yml up -d`
- stop docker containers `docker-compose -f services.yml down`
- connect to redis container `docker exec -it redisdb redis-cli`
- run node server **(a script for development environment )** `npm run devStart`

---

##Routes
- GET **`HOST/`**

- ### Articles
    - GET **`HOST/articles/`** get all articles in json with last updated order and accept **title createdBefore createdAfter** Param for search and **page limit** for pagination are valid
    
    - GET **`HOST/articles/id`** get a article with this id
    
    - POST **`HOST/articles/`** create a new article (user must be authorized) and **title content** are required
    
    - PUT **`HOST/articles/id/image`** add image file in **form-data** to article with this id **(image must be 500kb or less)**
    
    - PUT **`HOST/articles/id`** edit this article (user must be authorized and author of this article) title and content are required
    
    - DELETE **`HOST/articles/id`** delete this article (user must be authorized and author of this article)

- ### Users
   
   - POST **`HOST/users/register/`** get a json contain **username email password bio** and send activate link to this email address
   
   - GET **`HOST/users/activate/token`** send a link with this route for verify email of new user
   
   - POST **`HOST/users/login`** send user with token field in json if **username and password** are valid
   
   - PUT **`HOST/users/id`** change username of bio for this user (user must be authorized) **username and bio** are required
   
   - PATCH **`HOST/users/id/changepassword`** change the for this user (user must be authorized) **newpassword** are required

   