export const capatilize=(str)=>{
    if(!str) return ''

    str=str.toLowerCase()
    return str.charAt(0).toUpperCase()+str.slice(1)

}