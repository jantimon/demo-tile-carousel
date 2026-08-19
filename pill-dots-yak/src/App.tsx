import { Carousel, CarouselSlide } from "./Carousel";

export const App = () => (
  <Carousel slideCount={8}>
    <CarouselSlide>Item 1</CarouselSlide>
    <CarouselSlide>Item 2</CarouselSlide>
    <CarouselSlide>Item 3</CarouselSlide>
    <CarouselSlide>Item 4</CarouselSlide>
    <CarouselSlide>Item 5</CarouselSlide>
    <CarouselSlide>Item 6</CarouselSlide>
    <CarouselSlide>Item 7</CarouselSlide>
    <CarouselSlide>Item 8</CarouselSlide>
  </Carousel>
);
