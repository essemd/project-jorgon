// Will store animation data including state, image for a given animation
class Animation {

  constructor(image,target,canvas,loop){
    this.image = image;
    this.target = target;
    this.canvas = canvas;
    this.loop = loop || false;

    this.frameCount = this.image.details.frameCount; // How many frames in the animation
    this.duration = this.image.details.animationDuration;
    this.frameDuration = this.duration / this.frameCount;
    this.animationState = 0;
    this.lastFrameTime = Date.now();

  }

  update(){
      let drawX = this.target.xOld || (this.target.x * TILESIZE);
      let drawY = this.target.yOld || (this.target.y * TILESIZE);
      this.canvas.drawImage(getImageByIndex(this.image,this.animationState),drawX - this.image.details.offsetX,drawY - this.image.details.offsetY);
      if((Date.now() - this.lastFrameTime) > this.frameDuration){
        this.animationState++;
        this.lastFrameTime = Date.now();
      }
      if(this.loop && (this.animationState >= this.frameCount)){
        this.animationState = 0;
      }
      return (this.animationState >= this.frameCount); // If animation is complete
  }

  static updateAnimations(){
    for(let i = animations.length - 1; i >= 0; i--){
      if(animations[i].update()){
        //Deletes animations from animations array if they are complete
        animations.splice(i,1);
      };
    }
  }

}
