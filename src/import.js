var test = {
	print: function() {
		console.log("HELLO world");
		
		var rect = new Rectangle(1, 2);
		rect.print();
	}

};

class Rectangle {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  
  print() {
	  console.log("Hello from class ");
  }
}

export default test;