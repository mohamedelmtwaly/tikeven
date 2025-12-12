import FeaturedEvents from "./FeaturedEvents";
import WhyBookTik from "./WhyBookTik";
import VenuesSection from "./VenuesSection";
import PopularOrganizers from "./PopularOrganizers";
import CreateEventSection from "./CreateEventSection";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

import Categories from "@/components/Categories";
import HeroSlider from "./HeroSlider";

export default function BrowseByCategory() {

  return (
    <>
      <Nav transparent={true} wide />
      <HeroSlider/>
      <Categories/>
      <FeaturedEvents />
      <WhyBookTik/>
      <VenuesSection/>
      <PopularOrganizers/>
      <CreateEventSection/>
      <Footer/>

    </>
  );
}
