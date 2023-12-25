import * as fs from "fs";
import { ObjectId } from "mongodb";

import { generatePublicId } from "../../shop-shared/utils/generatePublicId";
import { CategoryNode } from "../../shop-shared-server/schema/categoriesTree.schema";
import categories from "./categories.source.json";

const processCategory = (category: (typeof categories)[number]): CategoryNode => {
	return {
		_id: new ObjectId(),
		title: {
			ua: category.title.ua,
			en: category.title.en,
			ru: category.title.ru,
		},
		description: {
			ua: category.title.ua,
			en: category.title.en,
			ru: category.title.ru,
		},
		sort: 1,
		active: true,
		publicId: generatePublicId(category.title.en),
		children: category.children
			? category.children.map((children) => processCategory(children))
			: [],
	};
};

const newCategories = categories.map((category) => processCategory(category));

fs.writeFileSync("./categoriesTree.example.json", JSON.stringify(newCategories, null, 2));
