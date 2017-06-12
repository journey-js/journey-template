import journey from "lib/journey.js";	

import home from "../views/home/home.js";
import notFound from "../views/notfound/notFound.js";
import page1 from "../views/page1/page1.js";

journey.add("/home", home);
journey.add("/page1", page1);
journey.add("/", home);
journey.add("/notFound", notFound);
