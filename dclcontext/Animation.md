3D Model Animations
How to animate 3D models in your scene

3D models in .glTF and .glb format can include as many animations as you want in them. Animations tell the mesh how to move, by specifying a series of keyframes that are laid out over time, the mesh then blends from one pose to the other to simulate continuous movement.

Most 3D model animations are skeletal animations. These animations simplify the complex geometry of the model into a "stick figure", linking every vertex in the mesh to the closest bone in the skeleton. Modelers adjust the skeleton into different poses, and the mesh stretches and bends to follow these movements.

As an alternative, vertex animations animate a model without the need of a skeleton. These animations specify the position of each vertex in the model directly. Decentraland supports these animations as well.

See Animations for details on how to create animations for a 3D model. Read Shape components for instructions on how to import a 3D model to a scene.

💡 Tip: Animations are usually better for moving something in place, not for changing the position of an entity. For example, you can set an animation to move a character's feet in place, but to change the location of the entity it's best to use the Transform component. See Positioning entities for more details.

Check a 3D model for animations
Not all glTF files include animations. To see if there are any available, you can do the following:

If using VS Code(recommended), install the GLTF Tools extension and view the contents of a glTF file there.

Open the Babylon Sandbox site and drag the glTF file (and any .jpg or .bin dependencies) to the browser.

Open the .glTF file with a text editor and scroll down till you find "animations":.

💡 Tip: In skeletal animations, an animation name is often comprised of its armature name, an underscore and its animation name. For example myArmature_animation1.

Automatic playing
If a 3D model includes any animations, the default behavior is that the first of these is always played on a loop.

To avoid this behavior, add an Animator component to the entity that has the model, and then handle the playing of animations explicitly. If an Animator component is present in the entity, all animations default to a playing: false state, and need to be manually played.

💡 Tip: In the Scene Editor, you can add an Animator component visually. See Add Components. You can also control animations in a no-code way via Actions, see Make any item smart.

Handle animations explicitly
An Animator component is used to access all the animations of the entity and can be used to explicitly tell the entity to play or stop an animation. The Animator component includes an array of states, this list must include one object for each one of the animations that the 3D model can perform. A single Animator can include as many states as needed.

Copy
// Create entity
const shark = engine.addEntity()

// Add a 3D model to it
GltfContainer.create(shark, {
src: 'models/shark.glb',
})

Animator.create(shark, {
states: [
{
clip: 'swim',
playing: true,
loop: true,
},
],
})
Each state object keeps track of if an animation is currently playing.

📔 Note: The Animator component must be imported via

import { Animator } from "@dcl/sdk/ecs"

See Imports for how to handle these easily.

Fetch an animation
Fetch a clip from the Animator by name using the .Animator.getClip() function. This function returns a mutable version of the animation state object.

Copy
const swimAnim = Animator.getClip(sharkEntity, 'swim')
Animator.getClip requires the following parameters:

entity: The entity of the Animator component that you want to query.

clipName: String for the name of the clip you want to fetch.

Animator.getClip fetches a mutable version of the animation state, so you can modify values freely on what this function returns.

Copy
const swimAnim = Animator.getClip(sharkEntity, 'swim')
swimAnim.looping = false
📔 Note: If you attempt to use Animator.getClip() to fetch a clip that exists in the 3D model, but is not listed in the Animator component, it returns null.

Play an animation
The .playing field in an animation state determines if the animation is currently playing. Note that multiple animations may be playing in a single 3D model at the same time.

Use the Animator.playSingleAnimation() function on an AnimationState object.

Copy
Animator.playSingleAnimation(sharkEntity, 'swim')
If the entity was playing any other animations, Animator.playSingleAnimation stops them.

Animator.playSingleAnimation requires the following parameters:

entity: The entity of the Animator component that you want to affect.

clipName: String for the name of the clip you want to play.

resetCursor: (optional) If true, it plays the animation from the start, even if the animation was previously paused. If false, it will keep playing the animation from where it was paused. Default: true.

Copy
Animator.playSingleAnimation(sharkEntity, 'swim', false)
The following table summarizes how Animator.playSingleAnimation() behaves, using different values for the resetCursor property:

reset = false (default)

reset = true

Currently playing

Has no effect.

Plays from the start.

Paused

Resumes from last frame played.

Plays from the start.

Finished (Non-looping)

Plays from the start.

Plays from the start.

Looping animations
By default, animations are played in a loop that keeps repeating the animation forever.

Change this setting by setting the loop property in the state object.

Copy
Animator.create(shark, {
states: [
{
clip: 'bite',
playing: true,
loop: false,
},
],
})
If looping is set to false, the animation plays just once and then stops, staying on the posture of the last frame.

Stop an animation
To stop all animations that an entity is playing, use Animator.stopAllAnimations().

Copy
Animator.stopAllAnimations(shark)
Animator.stopAllAnimations requires the following parameters:

entity: The entity of the Animator component that you want to affect.

resetCursor: (optional) If true, it returns to the posture in the first frame of the animation. If false, stays paused in its current posture. Default: true.

📔 Note: When playing an animation with Animator.playSingleAnimation, this function handles stopping all other animations behind the scenes. You don't need to explicitly stop other animations in that case.

When an animation finishes playing a non-looping animation, by default the 3D model remains in the last posture it had. To change this default behavior so that when the animation ends it goes back to the first posture, set the shouldReset property to true.

Copy
Animator.create(shark, {
states: [
{
name: 'bite',
clip: 'bite',
playing: true,
shouldReset: true,
loop: true,
},
],
})
You can also use Animator.stopAllAnimations() at any time to explicitly set the posture back to the first frame in the animation.

📔 Note: Resetting the posture is an abrupt change. If you want to make the model transition smoothly tinto another posture, you can either:

Copy

- apply an animation with a `weight` property of 0 and gradually increase the `weight`
- create an animation clip that describes a movement from the posture you want to transition from to the default posture you want.
  Handle multiple animations
  If a 3D model has multiple animations packed into it, a single Animator component can deal with all of them.

Copy
// Create entity
const shark = engine.addEntity()

// Add a 3D model to it
GltfContainer.create(shark, {
src: 'models/shark.glb'
})

Animator.create(shark, {
states:[{
clip: "swim",
playing: true,
loop: true
}. {
clip: "bite",
playing: true,
loop: true
}
]
})
In the example above, two animations are handled by separate state objects, and they are then both assigned to the same Animator component.

Each bone in an animation can only be affected by one animation at a time, unless these animations have a weight that adds up to a value of 1 or less.

If one animation only affects a character's legs, and another only affects a character's head, then they can be played at the same time without any issue. But if they both affect the character's legs, then you must either only play one at a time, or play them with lower weight values.

If in the above example, the bite animation only affects the shark's mouth, and the swim animation only affects the bones of the shark's spine, then they can both be played at the same time if they're on separate layers.

📔 Note: Animator.playSingleAnim() stops all other animations that the entity is currently playing. To play multiple animations at the same time, modify the playing property in the animation states manually.

Animation speed
Change the speed at which an animation is played by changing the speed property. The value of the speed is 1 by default.

Copy
Animator.create(shark, {
states: [
{
clip: 'swim',
playing: true,
loop: true,
speed: 2,
},
],
})
Set the speed lower than 1 to play it slower, for example to 0.5 to play it at half the speed. Set it higher than 1 to play it faster, for example to 2 to play it at double the speed.

Copy
const swimAnim = Animator.getClip(sharkEntity, 'swim')

swimAnim.speed = 0.5
Animation weight
The weight property allows a single model to carry out multiple animations on different layers at once, calculating a weighted average of all the movements involved in the animation. The value of weight determines how much importance that animation will be given in the average.

By default, weight is equal to 1. The value of weight can't be any higher than 1.

Copy
Animator.create(shark, {
states: [
{
clip: 'swim',
playing: true,
loop: true,
weight: 0.2,
},
],
})
The weight value of all active animations in an entity should add up to 1 at all times. If it adds up to less than 1, the weighted average will be using the default position of the armature for the remaining part of the calculation.

For example, in the code example above, we're playing the swim animation, that only has a weight of 0.2. This swimming movement will be quite subtle: only 20% of the intensity that the animation defines. The remaining 80% of the calculation takes values from the default posture of the armature.

The weight property can be used in interesting ways, for example the weight property of swim could be set in proportion to how fast the shark is swimming, so you don't need to create multiple animations for fast and slow swimming.

You could also change the weight value gradually when starting and stopping an animation to give it a more natural transition and to avoid jumps from the default pose to the first pose in the animation.

📔 Note: The added weight value of all animations that are acting on a 3D model's bone can't be more than 1. If more than one animation is affecting the same bones at the same time, they need to have their weight set to values that add to less than 1.

Copy
const swimAnim = Animator.getClip(sharkEntity, 'swim')

swimAnim.weight = 0.5
