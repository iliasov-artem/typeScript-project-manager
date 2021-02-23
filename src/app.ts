enum Role { ADMIN = 'ADMIN', USER = 'USER', EXPERT = 'EXPERT' }

const person = {
  name: 'art',
  age: 30,
  hobbies: ['art', 'sport'],
  role: Role.ADMIN
}
person.name = '1'
// person.name = true

const button = document.querySelector('button')!;
button.addEventListener('click', (a) => {
  console.log(a)
  console.log('Clicked')
});

if (button !== null) {
  button.addEventListener('click', () => {
    console.log('Clicked')
  });
}
