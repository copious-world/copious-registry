let t1 = {
    "a" : "the first",
    "b" : "the second",
    "c" : "the third"
}

// --- ---  ---  ---  ---  --- 
try {
    for ( let [ky,val] of t1 ) {
        console.log(ky,val)
    }
} catch (e) {

}



let aa = Object.entries(t1)
console.log(aa)

let bb = Object.values(t1)
console.log(bb)

let m1 = new Map(Object.entries(t1))

for ( let [ky,val] of m1 ) {
    console.log(ky,val)
    //
    console.log(m1.get(ky))
}

console.log("---------- ----------")
console.log(t1.constructor.name)
console.log(m1.constructor.name)


let cc = [ 1, 2, 3, 4, 5]
console.log(typeof cc.sort)