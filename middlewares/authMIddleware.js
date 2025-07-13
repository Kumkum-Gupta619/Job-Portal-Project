import jWT from 'jsonwebtoken'

const userAuth = async (req,res,next) =>{
     const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return next('Auth Failed');
}
 const token = authHeader.split(' ')[1]
     try{
        const payload = jWT.verify(token , process.env.JWT_SECRET)
        req.user = {userId: payload.userId}
        next();

     }catch(error){
        next ('Auth failed')
     }
     }

     export default userAuth;


