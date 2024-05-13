const ownerOrNot = (item, req) => {
    console.log("item: ",item);
    // console.log("req: ",req);
    console.log("item.owner.toString(): ",item.owner.toString());
    console.log("req.user?._id.toString(): ",req.user?._id.toString());
    
    try {
        if (item.owner.toString() != req.user?._id.toString()){
            return false
        }
        else if(item.owner.toString() == req.user?._id.toString()){
            return true
        }
    } catch (error) {
        console.log( `error in checkOwnerPermission for ${item}`)
        return "Error Occured"
    } 

}

export { ownerOrNot } 