new Promise(function(resolve,reject){
    setTimeout(()=>resolve(1),1000);
}).then(function(result){
    console.log('1');
    return;
}).then(function(){
    console.log('2');
    return 'finished';
}).then(function(result){
    console.log(result);
})