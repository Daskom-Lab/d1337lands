function topFunction(){
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
}


const buttonRight = document.getElementById('slideRight');
const buttonLeft = document.getElementById('slideLeft');

buttonRight.onclick = function () {
  document.getElementById('container').scrollLeft += (document.querySelector('.interest-card').clientWidth+40);
  if(Math.ceil(document.getElementById('container').scrollLeft / 10) * 10 === Math.ceil((document.querySelector('.interest-card').clientWidth * 2 + 70)/10) * 10){
    document.getElementById('container').scrollLeft = 0
  }
};
buttonLeft.onclick = function () {
  document.getElementById('container').scrollLeft -= (document.querySelector('.interest-card').clientWidth+40);
  if(document.getElementById('container').scrollLeft === 0){
    document.getElementById('container').scrollLeft += (document.querySelector('.interest-card').clientWidth * 2 + 70);
  }
};