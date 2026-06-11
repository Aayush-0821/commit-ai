let allowPush = false;

export function setPushPermissions(
    value:boolean
){
    allowPush = value;
}

export function canPush(){
    return allowPush;
}